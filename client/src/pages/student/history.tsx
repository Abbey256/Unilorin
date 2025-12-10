import Layout from "@/components/Layout";
import { Calendar, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface HistoryItem {
  sessionId: string;
  courseCode: string;
  courseTitle: string;
  startTime: string;
  endTime: string | null;
  status: "present" | "absent";
  markedAt: string | null;
}

export default function StudentHistory() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["attendance-history"],
    queryFn: api.attendance.getStudentHistory,
  });

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: api.auth.me,
    retry: false,
  });

  const records: HistoryItem[] = data?.records || [];
  const user = userData?.user;

  const filteredRecords = statusFilter === "all"
    ? records
    : records.filter((r) => r.status === statusFilter);

  const presentCount = records.filter(r => r.status === "present").length;
  const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  const handleExport = () => {
    const headers = ["Date", "Time", "Course Code", "Course Title", "Status"];
    const rows = records.map(r => [
      new Date(r.startTime).toLocaleDateString(),
      new Date(r.startTime).toLocaleTimeString(),
      r.courseCode,
      r.courseTitle,
      r.status === "present" ? "Present" : "Absent"
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_history_${user?.matricNumber || 'student'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Export Complete", description: "Your attendance history has been downloaded." });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900">Attendance History</h1>
            <p className="text-muted-foreground">Your complete attendance record for this semester.</p>
          </div>
          <button
            onClick={handleExport}
            disabled={records.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Classes Held</p>
                <p className="text-2xl font-bold text-slate-900">{records.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-[#1a1f6c]/20" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Classes Attended</p>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-100" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className={`text-2xl font-bold ${attendanceRate >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                  {attendanceRate}%
                </p>
              </div>
              <AlertCircle className={`w-8 h-8 ${attendanceRate >= 75 ? 'text-green-100' : 'text-red-100'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {attendanceRate >= 75
              ? "You're on track! Keep attending classes to maintain your eligibility."
              : "You're below the 75% attendance threshold. Attend more classes to be eligible for exams."}
          </p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#1a1f6c]"
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a1f6c]" />
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Class History</h3>
            <p className="text-muted-foreground">No classes have been held for your courses yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-muted-foreground font-medium">
                  <tr>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Course</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.sessionId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{new Date(record.startTime).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">{new Date(record.startTime).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{record.courseCode}</div>
                        <div className="text-xs text-muted-foreground">{record.courseTitle}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${record.status === 'present'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                          {record.status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
