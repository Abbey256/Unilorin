import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  faculty: text("faculty").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matricNumber: text("matric_number").unique(),
  staffId: text("staff_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  lecturerId: varchar("lecturer_id").notNull().references(() => users.id),
  department: text("department"),
  capacity: integer("capacity").default(200),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  geofenceRadius: integer("geofence_radius").default(100),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sessions.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  deviceId: text("device_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  markedAt: timestamp("marked_at").defaultNow().notNull(),
  status: text("status").default("verified").notNull(),
});

export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  deviceId: text("device_id").notNull().unique(),
  deviceName: text("device_name"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true).notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  markedAt: true,
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devices.$inferSelect;

export const UNILORIN_DEPARTMENTS = [
  { code: "CSC", name: "Computer Science", faculty: "Communication and Information Sciences" },
  { code: "MTS", name: "Mathematics", faculty: "Physical Sciences" },
  { code: "PHY", name: "Physics", faculty: "Physical Sciences" },
  { code: "CHM", name: "Chemistry", faculty: "Physical Sciences" },
  { code: "BCH", name: "Biochemistry", faculty: "Life Sciences" },
  { code: "MCB", name: "Microbiology", faculty: "Life Sciences" },
  { code: "BOT", name: "Botany", faculty: "Life Sciences" },
  { code: "ZOO", name: "Zoology", faculty: "Life Sciences" },
  { code: "ELE", name: "Electrical Engineering", faculty: "Engineering and Technology" },
  { code: "CVE", name: "Civil Engineering", faculty: "Engineering and Technology" },
  { code: "MEE", name: "Mechanical Engineering", faculty: "Engineering and Technology" },
  { code: "CHE", name: "Chemical Engineering", faculty: "Engineering and Technology" },
  { code: "AGE", name: "Agricultural Engineering", faculty: "Engineering and Technology" },
  { code: "CPE", name: "Computer Engineering", faculty: "Engineering and Technology" },
  { code: "ACC", name: "Accounting", faculty: "Management Sciences" },
  { code: "BUS", name: "Business Administration", faculty: "Management Sciences" },
  { code: "ECO", name: "Economics", faculty: "Social Sciences" },
  { code: "SOC", name: "Sociology", faculty: "Social Sciences" },
  { code: "PSY", name: "Psychology", faculty: "Social Sciences" },
  { code: "POL", name: "Political Science", faculty: "Social Sciences" },
  { code: "LAW", name: "Law", faculty: "Law" },
  { code: "MED", name: "Medicine", faculty: "Clinical Sciences" },
  { code: "NUR", name: "Nursing", faculty: "Basic Medical Sciences" },
  { code: "PHA", name: "Pharmacy", faculty: "Pharmaceutical Sciences" },
  { code: "EDU", name: "Education", faculty: "Education" },
  { code: "ENG", name: "English", faculty: "Arts" },
  { code: "HIS", name: "History", faculty: "Arts" },
  { code: "ARA", name: "Arabic", faculty: "Arts" },
  { code: "ISL", name: "Islamic Studies", faculty: "Arts" },
  { code: "GST", name: "General Studies", faculty: "General Studies" },
] as const;

export const UNILORIN_FACULTIES = [
  "Communication and Information Sciences",
  "Physical Sciences",
  "Life Sciences",
  "Engineering and Technology",
  "Management Sciences",
  "Social Sciences",
  "Law",
  "Clinical Sciences",
  "Basic Medical Sciences",
  "Pharmaceutical Sciences",
  "Education",
  "Arts",
  "General Studies",
] as const;
