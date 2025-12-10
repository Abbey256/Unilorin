import { supabase } from "./supabase";
import bcrypt from "bcryptjs";
import type {
  User,
  InsertUser,
  Course,
  InsertCourse,
  Session,
  InsertSession,
  AttendanceRecord,
  InsertAttendanceRecord,
  Device,
  InsertDevice,
  Department,
  InsertDepartment,
  Semester,
  InsertSemester,
} from "@shared/schema";

export interface IStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByMatric(matricNumber: string): Promise<User | undefined>;
  getUserByStaffId(staffId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validatePassword(user: User, password: string): Promise<boolean>;

  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  getCourseById(id: string): Promise<Course | undefined>;
  getCourseByCode(code: string): Promise<Course | undefined>;
  getCoursesByLecturer(lecturerId: string): Promise<Course[]>;
  getCoursesByDepartment(department: string): Promise<Course[]>;
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
  getUniqueStudentsByLecturer(lecturerId: string): Promise<number>;
  getCoursesWithActiveSessions(): Promise<Course[]>;
  getStudentStats(studentId: string): Promise<{
    courseId: string;
    courseCode: string;
    courseTitle: string;
    totalSessions: number;
    attendedSessions: number;
    percentage: number;
  }[]>;

  // Admin
  getAllUsers(): Promise<User[]>;
  toggleUserStatus(userId: string, isActive: boolean): Promise<User>;
  createSemester(semester: InsertSemester): Promise<Semester>;
  getSemesters(): Promise<Semester[]>;
  toggleSemesterStatus(semesterId: string, isActive: boolean): Promise<Semester>;
  getStudentHistory(studentId: string): Promise<{
    sessionId: string;
    courseCode: string;
    courseTitle: string;
    startTime: Date;
    endTime: Date | null;
    status: "present" | "absent";
    markedAt: Date | null;
  }[]>;
}

export class SupabaseStorage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async getUserByMatric(matricNumber: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('matric_number', matricNumber)
      .single();

    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async getUserByStaffId(staffId: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('staff_id', staffId)
      .single();

    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 12);

    const { data, error } = await supabase
      .from('users')
      .insert({
        matric_number: insertUser.matricNumber,
        staff_id: insertUser.staffId,
        name: insertUser.name,
        email: insertUser.email,
        password: hashedPassword,
        role: insertUser.role,
        department: insertUser.department,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapUser(data);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (user.password.startsWith('$2')) {
      return bcrypt.compare(password, user.password);
    }
    return user.password === password;
  }

  async getDepartments(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (error) return [];
    return data.map(this.mapDepartment);
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .insert({
        name: department.name,
        code: department.code,
        faculty: department.faculty,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapDepartment(data);
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return this.mapCourse(data);
  }

  async getCourseByCode(code: string): Promise<Course | undefined> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) return undefined;
    return this.mapCourse(data);
  }

  async getCoursesByLecturer(lecturerId: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('lecturer_id', lecturerId);

    if (error) return [];
    return data.map(this.mapCourse);
  }

  async getCoursesByDepartment(department: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('department', department);

    if (error) return [];
    return data.map(this.mapCourse);
  }

  async getAllCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('code');

    if (error) return [];
    return data.map(this.mapCourse);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        code: insertCourse.code,
        title: insertCourse.title,
        lecturer_id: insertCourse.lecturerId,
        department: insertCourse.department,
        capacity: insertCourse.capacity,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapCourse(data);
  }

  async getSessionById(id: string): Promise<Session | undefined> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return this.mapSession(data);
  }

  async getSessionByCourse(courseId: string): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data.map(this.mapSession);
  }

  async getActiveSessionByCourse(courseId: string): Promise<Session | undefined> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .single();

    if (error || !data) return undefined;
    return this.mapSession(data);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        course_id: insertSession.courseId,
        location: insertSession.location,
        latitude: insertSession.latitude,
        longitude: insertSession.longitude,
        geofence_radius: insertSession.geofenceRadius,

        start_time: insertSession.startTime,
        expires_at: insertSession.expiresAt,
        is_active: insertSession.isActive,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapSession(data);
  }

  async endSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .update({ is_active: false, end_time: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) throw new Error(error.message);
  }

  async getAttendanceBySession(sessionId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .order('marked_at', { ascending: false });

    if (error) return [];
    return data.map(this.mapAttendance);
  }

  async getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', studentId)
      .order('marked_at', { ascending: false });

    if (error) return [];
    return data.map(this.mapAttendance);
  }

  async checkAttendanceExists(sessionId: string, studentId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', studentId);

    if (error) return false;
    return data.length > 0;
  }

  async markAttendance(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        session_id: record.sessionId,
        student_id: record.studentId,
        latitude: record.latitude,
        longitude: record.longitude,
        device_id: record.deviceId,
        ip_address: record.ipAddress,
        user_agent: record.userAgent,
        status: record.status,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapAttendance(data);
  }

  async getDeviceByStudentId(studentId: string): Promise<Device | undefined> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .single();

    if (error || !data) return undefined;
    return this.mapDevice(data);
  }

  async getDeviceById(deviceId: string): Promise<Device | undefined> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (error || !data) return undefined;
    return this.mapDevice(data);
  }

  async registerDevice(insertDevice: InsertDevice): Promise<Device> {
    const { data, error } = await supabase
      .from('devices')
      .insert({
        student_id: insertDevice.studentId,
        device_id: insertDevice.deviceId,
        device_name: insertDevice.deviceName,
        user_agent: insertDevice.userAgent,
        is_active: insertDevice.isActive,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapDevice(data);
  }

  async updateDeviceLastUsed(deviceId: string): Promise<void> {
    const { error } = await supabase
      .from('devices')
      .update({ last_used: new Date().toISOString() })
      .eq('device_id', deviceId);

    if (error) throw new Error(error.message);
  }

  private mapUser(data: any): User {
    return {
      id: data.id,
      matricNumber: data.matric_number,
      staffId: data.staff_id,
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      department: data.department,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
    };
  }

  private mapSemester(data: any): Semester {
    return {
      id: data.id,
      name: data.name,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
    };
  }

  private mapDepartment(data: any): Department {
    return {
      id: data.id,
      name: data.name,
      code: data.code,
      faculty: data.faculty,
      createdAt: new Date(data.created_at),
    };
  }

  private mapCourse(data: any): Course {
    return {
      id: data.id,
      code: data.code,
      title: data.title,
      lecturerId: data.lecturer_id,
      department: data.department,
      capacity: data.capacity,
      createdAt: new Date(data.created_at),
    };
  }

  private mapSession(data: any): Session {
    return {
      id: data.id,
      courseId: data.course_id,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      geofenceRadius: data.geofence_radius,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : null,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
    };
  }

  private mapAttendance(data: any): AttendanceRecord {
    return {
      id: data.id,
      sessionId: data.session_id,
      studentId: data.student_id,
      latitude: data.latitude,
      longitude: data.longitude,
      deviceId: data.device_id,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      markedAt: new Date(data.marked_at),
      status: data.status,
    };
  }

  private mapDevice(data: any): Device {
    return {
      id: data.id,
      studentId: data.student_id,
      deviceId: data.device_id,
      deviceName: data.device_name,
      userAgent: data.user_agent,
      isActive: data.is_active,
      lastUsed: new Date(data.last_used),
      createdAt: new Date(data.created_at),
    };
  }
  async getUniqueStudentsByLecturer(lecturerId: string): Promise<number> {
    // 1. Get all courses by lecturer
    const courses = await this.getCoursesByLecturer(lecturerId);
    if (courses.length === 0) return 0;
    const courseIds = courses.map(c => c.id);

    // 2. Get all sessions for these courses
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .in('course_id', courseIds);

    if (sessionError || !sessions || sessions.length === 0) return 0;
    const sessionIds = sessions.map(s => s.id);

    // 3. Get unique students from attendance records
    // distinct() is not directly supported in simple select count with JS client easily for unique counting without fetching
    // So we fetch student_ids and count unique in memory (acceptable for MVP scale)
    const { data: records, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('student_id')
      .in('session_id', sessionIds);

    if (attendanceError || !records) return 0;

    const uniqueStudents = new Set(records.map(r => r.student_id));
    return uniqueStudents.size;
  }

  async getCoursesWithActiveSessions(): Promise<Course[]> {
    // 1. Get all active sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('course_id')
      .eq('is_active', true);

    if (sessionError || !sessions || sessions.length === 0) return [];

    // 2. Get unique course IDs
    const courseIds = Array.from(new Set(sessions.map(s => s.course_id)));

    // 3. Fetch course details
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds)
      .order('code');

    if (courseError || !courses) return [];
    return courses.map(this.mapCourse);
  }

  async getStudentStats(studentId: string): Promise<{
    courseId: string;
    courseCode: string;
    courseTitle: string;
    totalSessions: number;
    attendedSessions: number;
    percentage: number;
  }[]> {
    // 1. Get student details to find their department
    const student = await this.getUserById(studentId);
    if (!student) return [];

    // 2. Get all attendance records for the student
    const attendanceRecords = await this.getAttendanceByStudent(studentId);

    // 3. Identify relevant courses:
    //    a. Courses the student has attended (from records)
    //    b. Courses in the student's department (expected to attend)

    // Get course IDs from attendance
    const attendedSessionIds = Array.from(new Set(attendanceRecords.map(r => r.sessionId)));
    let attendedCourseIds: string[] = [];

    if (attendedSessionIds.length > 0) {
      const { data: sessions } = await supabase
        .from('sessions')
        .select('course_id')
        .in('id', attendedSessionIds);

      if (sessions) {
        attendedCourseIds = sessions.map(s => s.course_id);
      }
    }

    // Get courses from department
    let departmentCourses: Course[] = [];
    if (student.department) {
      departmentCourses = await this.getCoursesByDepartment(student.department);
    }

    // Combine unique course IDs
    const allRelevantCourseIds = Array.from(new Set([
      ...attendedCourseIds,
      ...departmentCourses.map(c => c.id)
    ]));

    if (allRelevantCourseIds.length === 0) return [];

    // 4. Fetch course details for all relevant courses
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .in('id', allRelevantCourseIds);

    if (courseError || !courses) return [];

    // 5. For each course, calculate stats
    const stats = await Promise.all(courses.map(async (course) => {
      // Get total sessions for this course
      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id);

      const totalSessions = count || 0;

      // Count how many sessions of THIS course the student attended
      // We need to check which of the student's attendance records belong to sessions of this course
      // Optimization: We can filter the `attendanceRecords` list if we map session->course first.
      // Since we don't have that map handy for *all* records without fetching all sessions, 
      // let's do a quick count query for accuracy or use the loaded data if possible.
      // To be safe and accurate:
      const { count: attendedCount } = await supabase
        .from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .in('session_id', (
          await supabase.from('sessions').select('id').eq('course_id', course.id)
        ).data?.map(s => s.id) || []
        );

      const studentAttendedCount = attendedCount || 0;

      return {
        courseId: course.id,
        courseCode: course.code,
        courseTitle: course.title,
        totalSessions,
        attendedSessions: studentAttendedCount,
        percentage: totalSessions > 0 ? Math.round((studentAttendedCount / totalSessions) * 100) : 0
      };
    }));

    return stats;
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data.map(this.mapUser);
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapUser(data);
  }

  async createSemester(insertSemester: InsertSemester): Promise<Semester> {
    const { data, error } = await supabase
      .from('semesters')
      .insert({
        name: insertSemester.name,
        start_date: insertSemester.startDate,
        end_date: insertSemester.endDate,
        is_active: insertSemester.isActive,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapSemester(data);
  }

  async getSemesters(): Promise<Semester[]> {
    const { data, error } = await supabase
      .from('semesters')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) return [];
    return data.map(this.mapSemester);
  }

  async toggleSemesterStatus(semesterId: string, isActive: boolean): Promise<Semester> {
    // If activating, deactivate all others first (optional rule, but good for "Active Semester")
    if (isActive) {
      await supabase
        .from('semesters')
        .update({ is_active: false })
        .neq('id', semesterId);
    }

    const { data, error } = await supabase
      .from('semesters')
      .update({ is_active: isActive })
      .eq('id', semesterId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapSemester(data);
  }

  async getStudentHistory(studentId: string): Promise<{
    sessionId: string;
    courseCode: string;
    courseTitle: string;
    startTime: Date;
    endTime: Date | null;
    status: "present" | "absent";
    markedAt: Date | null;
  }[]> {
    // 1. Get student details
    const student = await this.getUserById(studentId);
    if (!student || !student.department) return [];

    // 2. Get all courses in student's department
    const courses = await this.getCoursesByDepartment(student.department);
    if (courses.length === 0) return [];
    const courseIds = courses.map(c => c.id);

    // 3. Get all PAST sessions for these courses
    // "Past" means endTime is not null OR expiresAt < now
    const now = new Date().toISOString();
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .in('course_id', courseIds)
      .or(`end_time.not.is.null,expires_at.lt.${now}`) // Logic: Ended OR Expired
      .order('start_time', { ascending: false });

    if (sessionError || !sessions) return [];

    // 4. Get all attendance records for the student
    const attendanceRecords = await this.getAttendanceByStudent(studentId);

    // 5. Merge data
    const history = sessions.map(session => {
      const record = attendanceRecords.find(r => r.sessionId === session.id);
      const course = courses.find(c => c.id === session.course_id);

      return {
        sessionId: session.id,
        courseCode: course?.code || "Unknown",
        courseTitle: course?.title || "Unknown",
        startTime: new Date(session.start_time),
        endTime: session.end_time ? new Date(session.end_time) : null,
        status: record ? "present" : "absent",
        markedAt: record ? new Date(record.markedAt) : null,
      };
    });

    return history as any;
  }
}

export const storage = new SupabaseStorage();
