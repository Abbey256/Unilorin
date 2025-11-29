import Layout from "@/components/Layout";
import { Link } from "wouter";
import { Plus, Users, ChevronRight } from "lucide-react";

export default function LecturerSessions() {
  const sessions = [
    { id: 1, course: "GNS 312", title: "Digital Entrepreneurship", status: "Active", students: 142, time: "Now" },
    { id: 2, course: "CSC 401", title: "Software Engineering II", status: "Scheduled", students: 0, time: "Tomorrow, 10:00 AM" },
    { id: 3, course: "CSC 202", title: "Intro to Algorithms", status: "Completed", students: 320, time: "Yesterday" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900">My Classes</h1>
            <p className="text-muted-foreground">Manage your lecture sessions.</p>
          </div>
          <button className="bg-primary hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            Create Session
          </button>
        </div>

        <div className="grid gap-4">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm ${
                  session.status === 'Active' ? 'bg-green-100 text-green-700' : 
                  session.status === 'Scheduled' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {session.course.split(' ')[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{session.course}: {session.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {session.status === 'Completed' ? `${session.students} attended` : `${session.students} checked in`}</span>
                    <span>•</span>
                    <span>{session.time}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {session.status === 'Active' && (
                  <Link href="/lecturer/session/active">
                    <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors">
                      View Live
                    </button>
                  </Link>
                )}
                <button className="p-2 text-slate-400 hover:text-slate-600">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}