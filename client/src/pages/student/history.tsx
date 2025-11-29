import Layout from "@/components/Layout";
import { Calendar, Search, Filter, Download } from "lucide-react";

export default function StudentHistory() {
  const history = [
    { id: 1, course: "CSC 301", title: "Data Structures", date: "Nov 28, 2025", time: "2:00 PM", status: "Present", location: "LT 1" },
    { id: 2, course: "GNS 312", title: "Digital Entr.", date: "Nov 25, 2025", time: "10:00 AM", status: "Present", location: "LT A" },
    { id: 3, course: "MTH 202", title: "Linear Algebra", date: "Nov 22, 2025", time: "8:00 AM", status: "Absent", location: "LT B" },
    { id: 4, course: "CSC 301", title: "Data Structures", date: "Nov 21, 2025", time: "2:00 PM", status: "Present", location: "LT 1" },
    { id: 5, course: "CSC 405", title: "Artificial Intel.", date: "Nov 20, 2025", time: "12:00 PM", status: "Present", location: "CBT Centre" },
    { id: 6, course: "GNS 312", title: "Digital Entr.", date: "Nov 18, 2025", time: "10:00 AM", status: "Present", location: "LT A" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900">Attendance History</h1>
            <p className="text-muted-foreground">Your academic attendance record for 2024/2025 Session.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by course code..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
             <select className="px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-primary">
               <option>All Courses</option>
               <option>CSC 301</option>
               <option>GNS 312</option>
             </select>
             <select className="px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-primary">
               <option>All Status</option>
               <option>Present</option>
               <option>Absent</option>
             </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-muted-foreground font-medium">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Course</th>
                <th className="p-4 hidden md:table-cell">Location</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{item.date}</div>
                    <div className="text-xs text-muted-foreground">{item.time}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{item.course}</div>
                    <div className="text-xs text-muted-foreground">{item.title}</div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-slate-600">{item.location}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Present' 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}