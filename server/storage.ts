import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, desc } from "drizzle-orm";
import {
  users,
  courses,
  sessions,
  attendanceRecords,
  devices,
  type User,
  type InsertUser,
  type Course,
  type InsertCourse,
  type Session,
  type InsertSession,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type Device,
  type InsertDevice,
} from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByMatric(matricNumber: string): Promise<User | undefined>;
  getUserByStaffId(staffId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCourseById(id: string): Promise<Course | undefined>;
  getCourseByCode(code: string): Promise<Course | undefined>;
  getCoursesByLecturer(lecturerId: string): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  
  getSessionById(id: string): Promise<Session | undefined>;
  getSessionByCourse(courseId: string): Promise<Session[]>;
  getActiveSessionByCourse(courseId: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  endSession(sessionId: string): Promise<void>;
  
  getAttendanceBySession(sessionId: string): Promise<AttendanceRecord[]>;
  getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]>;
  checkAttendanceExists(sessionId: string, studentId: string): Promise<boolean>;
  markAttendance(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  
  getDeviceByStudentId(studentId: string): Promise<Device | undefined>;
  getDeviceById(deviceId: string): Promise<Device | undefined>;
  registerDevice(device: InsertDevice): Promise<Device>;
  updateDeviceLastUsed(deviceId: string): Promise<void>;
}

export class PostgresStorage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByMatric(matricNumber: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.matricNumber, matricNumber));
    return result[0];
  }

  async getUserByStaffId(staffId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.staffId, staffId));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    const result = await db.select().from(courses).where(eq(courses.id, id));
    return result[0];
  }

  async getCourseByCode(code: string): Promise<Course | undefined> {
    const result = await db.select().from(courses).where(eq(courses.code, code));
    return result[0];
  }

  async getCoursesByLecturer(lecturerId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.lecturerId, lecturerId));
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const result = await db.insert(courses).values(insertCourse).returning();
    return result[0];
  }

  async getSessionById(id: string): Promise<Session | undefined> {
    const result = await db.select().from(sessions).where(eq(sessions.id, id));
    return result[0];
  }

  async getSessionByCourse(courseId: string): Promise<Session[]> {
    return await db.select().from(sessions)
      .where(eq(sessions.courseId, courseId))
      .orderBy(desc(sessions.createdAt));
  }

  async getActiveSessionByCourse(courseId: string): Promise<Session | undefined> {
    const result = await db.select().from(sessions)
      .where(and(eq(sessions.courseId, courseId), eq(sessions.isActive, true)));
    return result[0];
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const result = await db.insert(sessions).values(insertSession).returning();
    return result[0];
  }

  async endSession(sessionId: string): Promise<void> {
    await db.update(sessions)
      .set({ isActive: false, endTime: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  async getAttendanceBySession(sessionId: string): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, sessionId))
      .orderBy(desc(attendanceRecords.markedAt));
  }

  async getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, studentId))
      .orderBy(desc(attendanceRecords.markedAt));
  }

  async checkAttendanceExists(sessionId: string, studentId: string): Promise<boolean> {
    const result = await db.select().from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.sessionId, sessionId),
        eq(attendanceRecords.studentId, studentId)
      ));
    return result.length > 0;
  }

  async markAttendance(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const result = await db.insert(attendanceRecords).values(record).returning();
    return result[0];
  }

  async getDeviceByStudentId(studentId: string): Promise<Device | undefined> {
    const result = await db.select().from(devices)
      .where(and(eq(devices.studentId, studentId), eq(devices.isActive, true)));
    return result[0];
  }

  async getDeviceById(deviceId: string): Promise<Device | undefined> {
    const result = await db.select().from(devices).where(eq(devices.deviceId, deviceId));
    return result[0];
  }

  async registerDevice(insertDevice: InsertDevice): Promise<Device> {
    const result = await db.insert(devices).values(insertDevice).returning();
    return result[0];
  }

  async updateDeviceLastUsed(deviceId: string): Promise<void> {
    await db.update(devices)
      .set({ lastUsed: new Date() })
      .where(eq(devices.deviceId, deviceId));
  }
}

export const storage = new PostgresStorage();
