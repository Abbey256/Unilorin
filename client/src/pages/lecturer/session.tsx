import Layout from "@/components/Layout";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Download, UserCheck, Search, ShieldAlert, ArrowLeft, Clock, Users, MapPin, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AttendanceWithStudent {
  id: string;
  student: {
    name: string;
    matricNumber: string | null;
  } | null;
  markedAt: Date;
  status: string;
}

interface SessionWithCourse {
  id: string;
  location: string;
  startTime: string;
  isActive: boolean;
  course: {
    code: string;
    title: string;
    capacity: number;
  };
  attendanceCount: number;
}


export default function LecturerSession() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const sessionId = new URLSearchParams(window.location.search).get("id");
  const [records, setRecords] = useState<AttendanceWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [manualMatric, setManualMatric] = useState("");
  const [isMarking, setIsMarking] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: sessionData } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await fetch(`/api/sessions/${sessionId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch session');
      return response.json();
    },
    enabled: !!sessionId,
  });

  const session: SessionWithCourse | null = sessionData?.session || null;

  const endSessionMutation = useMutation({
    mutationFn: (sessionId: string) => api.sessions.end(sessionId),
    onSuccess: () => {
      toast({ title: "Session Ended", description: "The attendance session has been closed." });
      queryClient.invalidateQueries({ queryKey: ["lecturer-sessions"] });
      setLocation("/lecturer/dashboard");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const markManualMutation = useMutation({
    mutationFn: async (matricNumber: string) => {
      return api.attendance.mark({
        sessionId,
        studentId: matricNumber, // Passing matric as Student ID for lookup
        latitude: "0.0", // Dummy
        longitude: "0.0", // Dummy
        deviceId: "manual_override",
      });
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: `Marked ${data.record.studentId} present manually.` });
      setIsManualModalOpen(false);
      setManualMatric("");
      // Optimistic update or refetch? The WebSocket might handle it, but let's invalidate to be sure
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMatric) return;
    markManualMutation.mutate(manualMatric);
  };

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
          setRecords(prev => {
            // Avoid duplicates
            if (prev.find(r => r.id === message.data.id)) return prev;
            return [message.data, ...prev];
          });
          toast({
            title: "New Check-in",
            description: `${message.data.student?.name || 'Student'} has marked attendance`,
          });
        }
      };

      wsRef.current = ws;

      return () => {
        ws.close();
      };
    }
  }, [sessionId]);

  const filteredRecords = records.filter(record =>
    record.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.student?.matricNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ["Name", "Matric Number", "Check-in Time", "Status"];
    const rows = records.map(r => [
      r.student?.name || "Unknown",
      r.student?.matricNumber || "N/A",
      new Date(r.markedAt).toLocaleString(),
      r.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${session?.course?.code || 'session'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Export Complete", description: "Attendance data downloaded as CSV." });
  };

  if (!sessionId) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No session selected.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-140px)] flex flex-col">
        <div className="mb-6">
          <button
            onClick={() => setLocation("/lecturer/dashboard")}
            className="text-sm text-muted-foreground hover:text-[#1a1f6c] mb-3 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                {session?.isActive && (
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
                <h1 className="text-2xl font-serif font-bold text-slate-900">
                  {session?.course?.code || "Loading..."} {session?.isActive ? "Live Session" : "Session Details"}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {session?.location || "Loading..."}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Started {session?.startTime ? new Date(session.startTime).toLocaleTimeString() : "--:--"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {records.length} / {session?.course?.capacity || 0} students
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {session?.isActive && (
                <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                  <DialogTrigger asChild>
                    <button className="bg-[#1a1f6c] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#141852]">
                      <UserCheck className="w-4 h-4" />
                      Mark Manually
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manual Attendance</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Student Matric Number</Label>
                        <Input
                          placeholder="e.g. 18/52HA000"
                          value={manualMatric}
                          onChange={(e) => setManualMatric(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" disabled={markManualMutation.isPending} className="w-full">
                        {markManualMutation.isPending ? "Marking..." : "Confirm Presence"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              <button
                onClick={handleExportCSV}
                className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              {session?.isActive && (
                <button
                  onClick={() => sessionId && endSessionMutation.mutate(sessionId)}
                  disabled={endSessionMutation.isPending}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {endSessionMutation.isPending ? "Ending..." : "End Session"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Present</p>
              <p className="text-2xl font-bold text-slate-900">{records.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Attendance Rate</p>
              <p className="text-2xl font-bold text-slate-900">
                {session?.course?.capacity ? Math.min(100, Math.round((records.length / session.course.capacity) * 100)) : 0}%
              </p>
            </div>
            <div className="md:col-span-2 flex justify-end items-center">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search matric number..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1a1f6c]"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a1f6c]" />
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No students match your search." : "No students have checked in yet."}
                </p>
                {session?.isActive && !searchTerm && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Students can mark attendance when they're within 100m of your location.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white sticky top-0 z-10 shadow-sm text-muted-foreground font-medium">
                    <tr>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Matric Number</th>
                      <th className="p-4">Check-in Time</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence initial={false}>
                      {filteredRecords.map((record) => (
                        <motion.tr
                          key={record.id}
                          initial={{ opacity: 0, x: -20, backgroundColor: "#eff6ff" }}
                          animate={{ opacity: 1, x: 0, backgroundColor: "#ffffff" }}
                          transition={{ duration: 0.5 }}
                          className="group hover:bg-slate-50"
                        >
                          <td className="p-4 font-medium text-slate-900">{record.student?.name || "Unknown"}</td>
                          <td className="p-4 font-mono text-slate-600">{record.student?.matricNumber || "N/A"}</td>
                          <td className="p-4 text-muted-foreground">{new Date(record.markedAt).toLocaleTimeString()}</td>
                          <td className="p-4">
                            {record.status === "verified" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                <UserCheck className="w-3 h-3" /> Verified
                              </span>
                            ) : record.status === "manual" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                <UserCheck className="w-3 h-3" /> Manual
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
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

