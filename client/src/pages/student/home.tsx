import Layout from "@/components/Layout";
import { Link } from "wouter";
import { MapPin, Clock, Calendar, CheckCircle2, AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
}

interface Session {
  id: string;
  courseId: string;
  location: string;
  isActive: boolean;
  startTime: string;
}

export default function StudentHome() {
  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: api.courses.getAll,
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["attendance-history"],
    queryFn: api.attendance.getStudentHistory,
  });

  const courses: Course[] = coursesData?.courses || [];
  const attendanceRecords = historyData?.records || [];
  
  const presentCount = attendanceRecords.filter((r: any) => r.status === "verified").length;
  const totalClasses = attendanceRecords.length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  const activeSession = courses.length > 0 ? courses[0] : null;

  return (
    <Layout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Check your classes and attendance status.</p>
        </header>

        {loadingCourses ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : courses.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary to-blue-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-4">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Classes Available
                </div>
                <h2 className="text-2xl font-bold mb-2">{activeSession?.code}: {activeSession?.title}</h2>
                <div className="flex items-center gap-4 text-blue-100 text-sm">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Lecture Theatre A</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Check for active session</span>
                </div>
              </div>
              
              <button 
                onClick={() => window.location.href = `/student/attendance/${encodeURIComponent(activeSession?.code || '')}`}
                className="bg-secondary hover:bg-yellow-400 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
                data-testid="button-mark-attendance"
              >
                <MapPin className="w-5 h-5" />
                Mark Attendance
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="bg-slate-100 rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">No courses available at this time.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Overall Attendance</h3>
              <CheckCircle2 className={`w-5 h-5 ${attendanceRate >= 75 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{attendanceRate}%</p>
            <p className={`text-xs mt-1 ${attendanceRate >= 75 ? 'text-green-600' : 'text-red-600'}`}>
              {attendanceRate >= 75 ? 'Eligible for exams' : 'Below 75% threshold'}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Classes Attended</h3>
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{presentCount}</p>
            <p className="text-xs text-muted-foreground mt-1">This semester</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Sessions</h3>
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalClasses}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all courses</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-serif font-bold text-lg">Available Courses</h3>
            <Link href="/student/history">
              <span className="text-sm text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer">
                View History <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
          
          <div className="divide-y divide-slate-100">
            {courses.map((course) => (
              <div key={course.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {course.code.split(' ')[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{course.code} - {course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.department}</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.location.href = `/student/attendance/${encodeURIComponent(course.code)}`}
                  className="px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Check In
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}