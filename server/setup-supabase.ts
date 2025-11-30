import { supabase } from "./supabase";

async function setupDatabase() {
  console.log("Setting up Supabase database...");

  const createTablesSQL = `
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
      role TEXT NOT NULL,
      department TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Create courses table
    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      lecturer_id UUID NOT NULL REFERENCES users(id),
      department TEXT,
      capacity INTEGER DEFAULT 200,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Create sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES courses(id),
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
      session_id UUID NOT NULL REFERENCES sessions(id),
      student_id UUID NOT NULL REFERENCES users(id),
      latitude DECIMAL(10, 7) NOT NULL,
      longitude DECIMAL(10, 7) NOT NULL,
      device_id TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      marked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      status TEXT DEFAULT 'verified' NOT NULL
    );

    -- Create devices table
    CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES users(id),
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
    CREATE INDEX IF NOT EXISTS idx_courses_lecturer ON courses(lecturer_id);
    CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
    CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);
    CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
    CREATE INDEX IF NOT EXISTS idx_devices_student ON devices(student_id);
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    
    if (error) {
      console.log("RPC method not available, tables may need to be created via Supabase dashboard");
      console.log("Please run the following SQL in your Supabase SQL Editor:");
      console.log(createTablesSQL);
    } else {
      console.log("Database tables created successfully!");
    }
  } catch (err) {
    console.log("Could not run SQL directly. Please create tables in Supabase dashboard.");
    console.log("SQL to run:");
    console.log(createTablesSQL);
  }
}

setupDatabase().catch(console.error);
