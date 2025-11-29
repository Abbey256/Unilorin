import Layout from "@/components/Layout";
import { Link } from "wouter";
import { MapPin, Clock, Calendar, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentHome() {
  return (
    <Layout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Olabisi. You have 2 classes today.</p>
        </header>

        {/* Hero Action Card */}
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
                Live Session Active
              </div>
              <h2 className="text-2xl font-bold mb-2">GNS 312: Digital Entrepreneurship</h2>
              <div className="flex items-center gap-4 text-blue-100 text-sm">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Lecture Theatre A</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 10:00 AM - 12:00 PM</span>
              </div>
            </div>
            
            <Link href="/student/attendance/GNS312">
              <button className="bg-secondary hover:bg-yellow-400 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Mark Attendance
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Overall Attendance</h3>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">87%</p>
            <p className="text-xs text-green-600 mt-1">Eligible for exams</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Classes Attended</h3>
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-slate-900">42</p>
            <p className="text-xs text-muted-foreground mt-1">This semester</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Missed Classes</h3>
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-3xl font-bold text-slate-900">6</p>
            <p className="text-xs text-muted-foreground mt-1">Caution required</p>
          </div>
        </div>

        {/* Recent History */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-serif font-bold text-lg">Recent History</h3>
            <Link href="/student/history">
              <a className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </a>
            </Link>
          </div>
          
          <div className="divide-y divide-slate-100">
            {[
              { code: "CSC 301", title: "Data Structures", date: "Yesterday, 2:00 PM", status: "Present" },
              { code: "GNS 312", title: "Digital Entrepreneurship", date: "Mon, 10:00 AM", status: "Present" },
              { code: "MTH 202", title: "Linear Algebra", date: "Fri, 8:00 AM", status: "Absent" },
            ].map((item, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {item.code.split(' ')[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{item.code} - {item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}