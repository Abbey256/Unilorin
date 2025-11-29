import Layout from "@/components/Layout";
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Download, UserCheck, Search, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

interface AttendanceWithStudent {
  id: string;
  student: {
    name: string;
    matricNumber: string | null;
  } | null;
  markedAt: Date;
  status: string;
}

export default function LecturerSession() {
  const params = useParams();
  const sessionId = new URLSearchParams(window.location.search).get("id");
  const [records, setRecords] = useState<AttendanceWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    async function loadAttendance() {
      if (!sessionId) return;
      
      try {
        const { records: initialRecords } = await api.attendance.getBySession(sessionId);
        setRecords(initialRecords);
      } catch (error) {
        console.error("Failed to load attendance:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAttendance();

    if (sessionId) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws?sessionId=${sessionId}`);
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "new_attendance") {
          setRecords(prev => [message.data, ...prev]);
        }
      };

      wsRef.current = ws;

      return () => {
        ws.close();
      };
    }
  }, [sessionId]);

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
              <p className="text-2xl font-bold text-slate-900">{records.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Attendance Rate</p>
              <p className="text-2xl font-bold text-slate-900">{Math.min(100, Math.round((records.length / 200) * 100))}%</p>
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
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-slate-400">Loading attendance records...</div>
              </div>
            ) : (
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
                    {records.map((record) => (
                      <motion.tr 
                        key={record.id}
                        initial={{ opacity: 0, x: -20, backgroundColor: "#eff6ff" }}
                        animate={{ opacity: 1, x: 0, backgroundColor: "#ffffff" }}
                        transition={{ duration: 0.5 }}
                        className="group"
                      >
                        <td className="p-4 font-medium text-slate-900">{record.student?.name || "Unknown"}</td>
                        <td className="p-4 font-mono text-slate-600">{record.student?.matricNumber || "N/A"}</td>
                        <td className="p-4 text-muted-foreground">{new Date(record.markedAt).toLocaleTimeString()}</td>
                        <td className="p-4">
                          {record.status === "verified" ? (
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
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}