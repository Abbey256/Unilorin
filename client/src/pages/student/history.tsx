import Layout from "@/components/Layout";
import { Calendar, Search, Filter, Download, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";

export default function StudentHistory() {
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data, isLoading } = useQuery({
    queryKey: ["attendance-history"],
    queryFn: api.attendance.getStudentHistory,
  });

  const records = data?.records || [];
  
  const filteredRecords = statusFilter === "all" 
    ? records 
    : records.filter((r: any) => r.status === statusFilter);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900">Attendance History</h1>
            <p className="text-muted-foreground">Your complete attendance record.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 ml-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="verified">Present</option>
              <option value="suspicious">Flagged</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Attendance Records</h3>
            <p className="text-muted-foreground">You haven't marked attendance for any class yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-muted-foreground font-medium">
                <tr>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Session</th>
                  <th className="p-4 hidden md:table-cell">Device</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record: any) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{new Date(record.markedAt).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">{new Date(record.markedAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">Session #{record.sessionId?.slice(0,8)}</div>
                      <div className="text-xs text-muted-foreground">Academic Session</div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-slate-600 text-xs font-mono">
                      {record.deviceId?.slice(0, 20)}...
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        record.status === 'verified' 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}>
                        {record.status === 'verified' ? 'Present' : 'Flagged'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}