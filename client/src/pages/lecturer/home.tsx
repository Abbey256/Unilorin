import Layout from "@/components/Layout";
import { Link } from "wouter";
import { Users, Clock, BarChart3, Plus, MoreHorizontal } from "lucide-react";

export default function LecturerHome() {
  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Instructor Dashboard</h1>
            <p className="text-muted-foreground">Manage your classes and attendance reports.</p>
          </div>
          <button className="bg-primary hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Students</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">1,240</span>
              <span className="text-xs text-green-600 font-medium mb-1.5">Across 3 courses</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg. Attendance</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">82%</span>
              <span className="text-xs text-green-600 font-medium mb-1.5">↑ 4% vs last week</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Fraud Attempts</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">3</span>
              <span className="text-xs text-muted-foreground font-medium mb-1.5">Blocked by System</span>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Active Sessions</h2>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-blue-50 rounded-lg flex flex-col items-center justify-center text-primary border border-blue-100">
                   <span className="text-xs font-bold uppercase">NOW</span>
                   <span className="font-bold text-lg">Live</span>
                 </div>
                 <div>
                   <h3 className="font-bold text-lg text-slate-900">GNS 312: Digital Entrepreneurship</h3>
                   <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                     <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Started 14 mins ago</span>
                     <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 142 / 200 checked in</span>
                   </div>
                 </div>
               </div>
               
               <div className="flex items-center gap-3 w-full md:w-auto">
                 <Link href="/lecturer/session/active">
                   <button className="flex-1 md:flex-none px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
                     View Live Feed
                   </button>
                 </Link>
                 <button className="flex-1 md:flex-none px-6 py-2 bg-red-50 text-red-600 border border-red-100 font-medium rounded-lg hover:bg-red-100 transition-colors">
                   End Session
                 </button>
               </div>
             </div>
             
             {/* Progress bar */}
             <div className="bg-slate-100 h-1.5 w-full">
               <div className="bg-green-500 h-full w-[71%]" />
             </div>
          </div>
        </section>

        {/* Recent Courses Table */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">My Courses</h2>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-muted-foreground font-medium">
                <tr>
                  <th className="p-4">Course Code</th>
                  <th className="p-4">Course Title</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4">Students</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">CSC 401</td>
                  <td className="p-4">Software Engineering II</td>
                  <td className="p-4 text-muted-foreground">Mon, 10:00 AM</td>
                  <td className="p-4">85</td>
                  <td className="p-4 text-right">
                    <button className="text-muted-foreground hover:text-primary"><MoreHorizontal className="w-5 h-5" /></button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">CSC 202</td>
                  <td className="p-4">Introduction to Algorithms</td>
                  <td className="p-4 text-muted-foreground">Wed, 2:00 PM</td>
                  <td className="p-4">340</td>
                  <td className="p-4 text-right">
                    <button className="text-muted-foreground hover:text-primary"><MoreHorizontal className="w-5 h-5" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
}