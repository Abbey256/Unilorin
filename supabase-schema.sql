-- UniAttend Smart Attendance System - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  faculty TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matric_number TEXT UNIQUE,
  staff_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department TEXT,
  capacity INTEGER DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  geofence_radius INTEGER DEFAULT 100,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  device_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  marked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'verified' NOT NULL,
  UNIQUE(session_id, student_id)
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  last_used TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_matric ON users(matric_number);
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON users(staff_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_courses_lecturer ON courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_devices_student ON devices(student_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access
CREATE POLICY "Service role has full access to users" ON users FOR ALL USING (true);
CREATE POLICY "Service role has full access to courses" ON courses FOR ALL USING (true);
CREATE POLICY "Service role has full access to sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "Service role has full access to attendance_records" ON attendance_records FOR ALL USING (true);
CREATE POLICY "Service role has full access to devices" ON devices FOR ALL USING (true);
CREATE POLICY "Service role has full access to departments" ON departments FOR ALL USING (true);

-- Insert default departments for University of Ilorin
INSERT INTO departments (name, code, faculty) VALUES
  ('Computer Science', 'CSC', 'Communication and Information Sciences'),
  ('Mathematics', 'MTS', 'Physical Sciences'),
  ('Physics', 'PHY', 'Physical Sciences'),
  ('Chemistry', 'CHM', 'Physical Sciences'),
  ('Biochemistry', 'BCH', 'Life Sciences'),
  ('Microbiology', 'MCB', 'Life Sciences'),
  ('Electrical Engineering', 'ELE', 'Engineering and Technology'),
  ('Civil Engineering', 'CVE', 'Engineering and Technology'),
  ('Mechanical Engineering', 'MEE', 'Engineering and Technology'),
  ('Chemical Engineering', 'CHE', 'Engineering and Technology'),
  ('Computer Engineering', 'CPE', 'Engineering and Technology'),
  ('Accounting', 'ACC', 'Management Sciences'),
  ('Business Administration', 'BUS', 'Management Sciences'),
  ('Economics', 'ECO', 'Social Sciences'),
  ('Sociology', 'SOC', 'Social Sciences'),
  ('Law', 'LAW', 'Law'),
  ('Medicine', 'MED', 'Clinical Sciences'),
  ('Pharmacy', 'PHA', 'Pharmaceutical Sciences'),
  ('Education', 'EDU', 'Education'),
  ('General Studies', 'GST', 'General Studies')
ON CONFLICT (code) DO NOTHING;
