import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertCourseSchema, insertSessionSchema, insertAttendanceRecordSchema, insertSemesterSchema, insertDepartmentSchema, UNILORIN_DEPARTMENTS } from "@shared/schema";
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
      proxy: true, // Required for Render/proxies
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  const requireAuth = (req: AuthRequest, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: AuthRequest, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };

  // Seeding Departments on Startup
  const currentDepts = await storage.getDepartments();
  if (currentDepts.length === 0) {
    console.log("Seeding departments...");
    for (const dept of UNILORIN_DEPARTMENTS) {
      await storage.createDepartment(dept);
    }
  }

  app.get("/api/departments", async (_req: Request, res: Response) => {
    try {
      const departments = await storage.getDepartments();
      res.json({ departments });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/departments", requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.json({ department });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
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

      if (!user.isActive) {
        return res.status(403).json({ error: "Account is deactivated. Please contact admin." });
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
        // For students, filter by their department and active sessions
        // This ensures "Zoology" students only see "Zoology" courses
        if (user.department) {
          courses = await storage.getCoursesByDepartment(user.department);
          // Optional: Filter further for active sessions if desired, but user asked for "Course filtering" primarily
        } else {
          courses = await storage.getCoursesWithActiveSessions();
        }
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

      const durationMinutes = req.body.duration ? parseInt(req.body.duration) : null;
      let expiresAt = null;

      if (durationMinutes && durationMinutes > 0) {
        expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
      }

      const session = await storage.createSession({
        courseId,
        location,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        geofenceRadius: geofenceRadius || 100,
        startTime: new Date(),
        expiresAt: expiresAt,
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

      if (session) {
        // Check if expired
        if (session.isActive && session.expiresAt && new Date() > session.expiresAt) {
          await storage.endSession(session.id);
          session = undefined;
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
      // Allow Student OR Lecturer (for manual marking)
      if (!user || (user.role !== "student" && user.role !== "lecturer" && user.role !== "admin")) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // If Lecturer/Admin marks attendance, we bypass Geofence/Device checks (Manual override)
      const isManualOverride = user.role === "lecturer" || user.role === "admin";

      let { sessionId, latitude, longitude, deviceId, studentId } = req.body;
      let targetStudentId = user.id;

      // Manual Mode Logic
      if (isManualOverride) {
        if (!studentId) return res.status(400).json({ error: "Student ID (matric) is required for manual attendance" });

        // Find student by matric/id
        let targetStudent = await storage.getUserById(studentId); // Try ID first
        if (!targetStudent) targetStudent = await storage.getUserByMatric(studentId); // Try Matric

        if (!targetStudent) return res.status(404).json({ error: "Student not found" });
        targetStudentId = targetStudent.id;

        // Mock data for manual entry
        latitude = latitude || "0.0";
        longitude = longitude || "0.0";
        deviceId = deviceId || "manual_override_by_lecturer";
      } else {
        if (!sessionId || !latitude || !longitude || !deviceId) {
          return res.status(400).json({ error: "Missing required fields" });
        }
      }

      const session = await storage.getSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (!session.isActive) {
        return res.status(400).json({ error: "Session is not active" });
      }

      // Check for expiry (Manual override can ignore expiry if desired? Let's enforce it for now)
      if (session.expiresAt && new Date() > session.expiresAt) {
        // Maybe allow override? User didn't specify. Enforce for now.
        await storage.endSession(session.id);
        return res.status(400).json({ error: "Session has expired" });
      }

      const alreadyMarked = await storage.checkAttendanceExists(sessionId, targetStudentId);
      if (alreadyMarked) {
        return res.status(400).json({ error: "Attendance already marked for this session" });
      }

      if (!isManualOverride) {
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

        const existingDevice = await storage.getDeviceByStudentId(targetStudentId);
        if (existingDevice && existingDevice.deviceId !== deviceId) {
          return res.status(400).json({
            error: "Device mismatch detected. Please use your registered device.",
            status: "suspicious"
          });
        }

        if (!existingDevice) {
          await storage.registerDevice({
            studentId: targetStudentId,
            deviceId,
            deviceName: req.headers["user-agent"] || "Unknown",
            userAgent: req.headers["user-agent"] || "",
            isActive: true,
          });
        } else {
          await storage.updateDeviceLastUsed(deviceId);
        }
      }

      const record = await storage.markAttendance({
        sessionId,
        studentId: targetStudentId,
        latitude,
        longitude,
        deviceId: isManualOverride ? "manual_entry" : deviceId,
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || "",
        status: isManualOverride ? "manual" : "verified",
      });

      const clients = sessionClients.get(sessionId);
      if (clients) {
        const targetUser = await storage.getUserById(targetStudentId);
        const message = JSON.stringify({
          type: "new_attendance",
          data: {
            ...record,
            student: { ...targetUser, password: undefined },
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

      const history = await storage.getStudentHistory(user.id);
      res.json({ records: history });
    } catch (error) {
      console.error("Get student attendance error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/attendance/stats", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user || user.role !== "student") {
        return res.status(403).json({ error: "Only students can view their stats" });
      }

      const stats = await storage.getStudentStats(user.id);
      res.json({ stats });
    } catch (error) {
      console.error("Get student stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Routes
  app.get("/api/admin/users", requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ users: users.map(u => ({ ...u, password: undefined })) });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/users/:id/toggle-status", requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { isActive } = req.body;
      const user = await storage.toggleUserStatus(req.params.id, isActive);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/semesters", requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const semesters = await storage.getSemesters();
      res.json({ semesters });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/semesters", requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = insertSemesterSchema.parse(req.body);
      const semester = await storage.createSemester(validatedData);
      res.json({ semester });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/semesters/:id/toggle-status", requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { isActive } = req.body;
      const semester = await storage.toggleSemesterStatus(req.params.id, isActive);
      res.json({ semester });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Temporary Setup Route
  app.get("/api/setup/admin", async (_req: Request, res: Response) => {
    try {
      const existingAdmin = await storage.getUserByEmail("admin@unilorin.edu.ng");
      if (existingAdmin) {
        // Force update to ensure correct role and active status
        const { data, error } = await storage.supabase
          .from('users')
          .update({
            is_active: true,
            role: 'admin',
            staff_id: 'ADMIN001' // Ensure staffId is set
          })
          .eq('id', existingAdmin.id)
          .select()
          .single();

        return res.json({
          message: "Admin account updated and activated",
          email: "admin@unilorin.edu.ng",
          staffId: "ADMIN001",
          password: "admin123"
        });
      }

      const adminUser = await storage.createUser({
        name: "Super Admin",
        email: "admin@unilorin.edu.ng",
        password: "admin123",
        role: "admin",
        matricNumber: null,
        staffId: "ADMIN001",
        department: null,
        isActive: true,
      });

      res.json({
        message: "Admin created",
        email: adminUser.email,
        staffId: adminUser.staffId,
        password: "admin123"
      });
    } catch (error) {
      console.error("Setup error:", error);
      res.status(500).json({ error: "Setup failed" });
    }
  });

  return httpServer;
}
