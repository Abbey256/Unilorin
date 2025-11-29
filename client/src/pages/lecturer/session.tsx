import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, UserCheck, Search, ShieldAlert } from "lucide-react";

interface Student {
  id: string;
  name: string;
  matric: string;
  time: string;
  status: "verified" | "suspicious";
}

export default function LecturerSession() {
  const [students, setStudents] = useState<Student[]>([
    { id: "1", name: "Olabisi Abiodun", matric: "18/52HA019", time: "10:02 AM", status: "verified" },
    { id: "2", name: "Sarah Johnson", matric: "18/52HA044", time: "10:03 AM", status: "verified" },
    { id: "3", name: "Michael Chen", matric: "18/52HA012", time: "10:05 AM", status: "verified" },
  ]);

  // Simulate live check-ins
  useEffect(() => {
    const interval = setInterval(() => {
      const newStudent: Student = {
        id: Math.random().toString(),
        name: "New Student " + Math.floor(Math.random() * 100),
        matric: "18/52HA0" + Math.floor(Math.random() * 99),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: Math.random() > 0.9 ? "suspicious" : "verified"
      };
      setStudents(prev => [newStudent, ...prev]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className="h-[calc(100vh-140px)] flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
               <h1 className="text-2xl font-serif font-bold text-slate-900">GNS 312 Live Session</h1>
            </div>
            <p className="text-muted-foreground">Lecture Theatre A • Started 10:00 AM</p>
          </div>
          
          <div className="flex gap-3">
            <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
              End Class
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          {/* Stats Bar */}
          <div className="p-4 border-b border-slate-100 grid grid-cols-4 gap-4 bg-slate-50/50">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Present</p>
              <p className="text-2xl font-bold text-slate-900">{students.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Attendance Rate</p>
              <p className="text-2xl font-bold text-slate-900">{Math.min(100, Math.round((students.length / 200) * 100))}%</p>
            </div>
            <div className="col-span-2 flex justify-end items-center">
               <div className="relative w-64">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Search matric number..." 
                   className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                 />
               </div>
            </div>
          </div>

          {/* Live List */}
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 z-10 shadow-sm text-muted-foreground font-medium">
                <tr>
                  <th className="p-4 w-1/4">Student Name</th>
                  <th className="p-4 w-1/4">Matric Number</th>
                  <th className="p-4 w-1/4">Check-in Time</th>
                  <th className="p-4 w-1/4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence initial={false}>
                  {students.map((student) => (
                    <motion.tr 
                      key={student.id}
                      initial={{ opacity: 0, x: -20, backgroundColor: "#eff6ff" }}
                      animate={{ opacity: 1, x: 0, backgroundColor: "#ffffff" }}
                      transition={{ duration: 0.5 }}
                      className="group"
                    >
                      <td className="p-4 font-medium text-slate-900">{student.name}</td>
                      <td className="p-4 font-mono text-slate-600">{student.matric}</td>
                      <td className="p-4 text-muted-foreground">{student.time}</td>
                      <td className="p-4">
                        {student.status === "verified" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                            <UserCheck className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                            <ShieldAlert className="w-3 h-3" /> Suspicious
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}