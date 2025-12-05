import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertCourseSchema, insertSessionSchema, insertAttendanceRecordSchema, UNILORIN_DEPARTMENTS } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { WebSocketServer, WebSocket } from "ws";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
  }
}

interface AuthRequest extends Request {
  session: session.Session & Partial<session.SessionData>;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const sessionClients = new Map<string, Set<WebSocket>>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get("sessionId");

    if (sessionId) {
      if (!sessionClients.has(sessionId)) {
        sessionClients.set(sessionId, new Set());
      }
      sessionClients.get(sessionId)!.add(ws);

      ws.on("close", () => {
        sessionClients.get(sessionId)?.delete(ws);
        if (sessionClients.get(sessionId)?.size === 0) {
          sessionClients.delete(sessionId);
        }
      });
    }
  });

  app.use(
    session({
      store: new MemoryStoreSession({
        checkPeriod: 86400000,
      }),
      secret: process.env.SESSION_SECRET || "uniattend-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

  const requireAuth = (req: AuthRequest, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  app.get("/api/departments", async (_req: Request, res: Response) => {
    res.json({ departments: UNILORIN_DEPARTMENTS });
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      if (validatedData.role === "student" && !validatedData.matricNumber) {
        return res.status(400).json({ error: "Matric number required for students" });
      }
      if (validatedData.role === "lecturer" && !validatedData.staffId) {
        return res.status(400).json({ error: "Staff ID required for lecturers" });
      }

      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      if (validatedData.matricNumber) {
        const existingMatric = await storage.getUserByMatric(validatedData.matricNumber);
        if (existingMatric) {
          return res.status(400).json({ error: "Matric number already registered" });
        }
      }

      if (validatedData.staffId) {
        const existingStaff = await storage.getUserByStaffId(validatedData.staffId);
        if (existingStaff) {
          return res.status(400).json({ error: "Staff ID already registered" });
        }
      }

      if (validatedData.role === "student") {
        const deviceId = req.body.deviceId;
        if (!deviceId) {
          return res.status(400).json({ error: "Device ID is required for registration" });
        }

        const existingDevice = await storage.getDeviceById(deviceId);
        if (existingDevice) {
          return res.status(400).json({ error: "This device is already registered to another student account." });
        }
      }

      const user = await storage.createUser(validatedData);

      // If student, immediately lock this device to them
      if (user.role === "student" && req.body.deviceId) {
        await storage.registerDevice({
          studentId: user.id,
          deviceId: req.body.deviceId,
          deviceName: req.headers["user-agent"] || "Unknown",
          userAgent: req.headers["user-agent"] || "",
          isActive: true,
        });
      }

      (req as AuthRequest).session.userId = user.id;
      (req as AuthRequest).session.role = user.role;

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { identifier, password, role } = req.body;

      if (!identifier || !password || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      let user;
      if (role === "student") {
        user = await storage.getUserByMatric(identifier);
      } else {
        user = await storage.getUserByStaffId(identifier);
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await storage.validatePassword(user, password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      (req as AuthRequest).session.userId = user.id;
      (req as AuthRequest).session.role = user.role;

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req: AuthRequest, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res: Response) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: { ...user, password: undefined } });
  });

  app.get("/api/courses", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user) return res.sendStatus(401);

      let courses;
      if (user.role === "lecturer") {
        courses = await storage.getCoursesByLecturer(user.id);
      } else {
        // For students, only return courses with active sessions
        courses = await storage.getCoursesWithActiveSessions();
      }

      res.json({ courses });
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/courses", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user || user.role !== "lecturer") {
        return res.status(403).json({ error: "Only lecturers can create courses" });
      }

      const existingCourse = await storage.getCourseByCode(req.body.code);
      if (existingCourse) {
        return res.status(400).json({ error: "Course code already exists" });
      }

      const validatedData = insertCourseSchema.parse({
        ...req.body,
        lecturerId: user.id,
      });

      const course = await storage.createCourse(validatedData);
      res.json({ course });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Create course error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/sessions", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user || user.role !== "lecturer") {
        return res.status(403).json({ error: "Only lecturers can create sessions" });
      }

      const { courseId, location, latitude, longitude, geofenceRadius } = req.body;

      if (!courseId || !location || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required fields: courseId, location, latitude, longitude" });
      }

      const course = await storage.getCourseById(courseId);
      if (!course || course.lecturerId !== user.id) {
        return res.status(403).json({ error: "Not authorized for this course" });
      }

      const existingActive = await storage.getActiveSessionByCourse(courseId);
      if (existingActive) {
        return res.status(400).json({ error: "Active session already exists for this course" });
      }

      const session = await storage.createSession({
        courseId,
        location,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        geofenceRadius: geofenceRadius || 100,
        startTime: new Date(),
        isActive: true,
      });

      res.json({ session });
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/sessions/active/:courseIdOrCode", async (req: Request, res: Response) => {
    try {
      const param = req.params.courseIdOrCode;
      let session = await storage.getActiveSessionByCourse(param);

      if (!session) {
        const course = await storage.getCourseByCode(param);
        if (course) {
          session = await storage.getActiveSessionByCourse(course.id);
        }
      }

      res.json({ session });
    } catch (error) {
      console.error("Get active session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/analytics/lecturer", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user || user.role !== "lecturer") {
        return res.status(403).json({ error: "Only lecturers can access this" });
      }

      const uniqueStudents = await storage.getUniqueStudentsByLecturer(user.id);
      res.json({ uniqueStudents });
    } catch (error) {
      console.error("Get lecturer analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/sessions/lecturer", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user || user.role !== "lecturer") {
        return res.status(403).json({ error: "Only lecturers can access this" });
      }

      const courses = await storage.getCoursesByLecturer(user.id);
      const sessionsWithCourses = [];

      for (const course of courses) {
        const courseSessions = await storage.getSessionByCourse(course.id);
        for (const session of courseSessions) {
          const attendanceCount = (await storage.getAttendanceBySession(session.id)).length;
          sessionsWithCourses.push({
            ...session,
            course,
            attendanceCount,
          });
        }
      }

      res.json({ sessions: sessionsWithCourses });
    } catch (error) {
      console.error("Get lecturer sessions error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/sessions/:sessionId", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const session = await storage.getSessionById(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const course = await storage.getCourseById(session.courseId);
      const attendanceRecords = await storage.getAttendanceBySession(session.id);

      res.json({
        session: {
          ...session,
          course,
          attendanceCount: attendanceRecords.length,
        }
      });
    } catch (error) {
      console.error("Get session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/sessions/:sessionId/end", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user || user.role !== "lecturer") {
        return res.status(403).json({ error: "Only lecturers can end sessions" });
      }

      const session = await storage.getSessionById(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const course = await storage.getCourseById(session.courseId);
      if (!course || course.lecturerId !== user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.endSession(req.params.sessionId);
      res.json({ message: "Session ended" });
    } catch (error) {
      console.error("End session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/attendance", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user || user.role !== "student") {
        return res.status(403).json({ error: "Only students can mark attendance" });
      }

      const { sessionId, latitude, longitude, deviceId } = req.body;

      if (!sessionId || !latitude || !longitude || !deviceId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const session = await storage.getSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (!session.isActive) {
        return res.status(400).json({ error: "Session is not active" });
      }

      const alreadyMarked = await storage.checkAttendanceExists(sessionId, user.id);
      if (alreadyMarked) {
        return res.status(400).json({ error: "Attendance already marked for this session" });
      }

      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(session.latitude),
        parseFloat(session.longitude)
      );

      if (distance > (session.geofenceRadius || 100)) {
        return res.status(400).json({
          error: "You are outside the classroom geofence",
          distance: Math.round(distance)
        });
      }

      const existingDevice = await storage.getDeviceByStudentId(user.id);
      if (existingDevice && existingDevice.deviceId !== deviceId) {
        return res.status(400).json({
          error: "Device mismatch detected. Please use your registered device.",
          status: "suspicious"
        });
      }

      if (!existingDevice) {
        await storage.registerDevice({
          studentId: user.id,
          deviceId,
          deviceName: req.headers["user-agent"] || "Unknown",
          userAgent: req.headers["user-agent"] || "",
          isActive: true,
        });
      } else {
        await storage.updateDeviceLastUsed(deviceId);
      }

      const record = await storage.markAttendance({
        sessionId,
        studentId: user.id,
        latitude,
        longitude,
        deviceId,
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || "",
        status: "verified",
      });

      const clients = sessionClients.get(sessionId);
      if (clients) {
        const message = JSON.stringify({
          type: "new_attendance",
          data: {
            ...record,
            student: { ...user, password: undefined },
          },
        });
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }

      res.json({ record, message: "Attendance marked successfully" });
    } catch (error) {
      console.error("Attendance error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/attendance/session/:sessionId", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const records = await storage.getAttendanceBySession(req.params.sessionId);

      const recordsWithStudents = await Promise.all(
        records.map(async (record) => {
          const student = await storage.getUserById(record.studentId);
          return {
            ...record,
            student: student ? { ...student, password: undefined } : null,
          };
        })
      );

      res.json({ records: recordsWithStudents });
    } catch (error) {
      console.error("Get attendance error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/attendance/student", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user || user.role !== "student") {
        return res.status(403).json({ error: "Only students can view their attendance" });
      }

      const records = await storage.getAttendanceByStudent(user.id);

      const recordsWithSessions = await Promise.all(
        records.map(async (record) => {
          const session = await storage.getSessionById(record.sessionId);
          const course = session ? await storage.getCourseById(session.courseId) : null;
          return {
            ...record,
            session,
            course,
          };
        })
      );

      res.json({ records: recordsWithSessions });
    } catch (error) {
      console.error("Get student attendance error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
