import Layout from "@/components/Layout";
import { useLocation } from "wouter";
import { Plus, Users, ChevronRight, Loader2, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Session {
  id: string;
  isActive: boolean;
  startTime: string;
  location: string;
  attendanceCount: number;
  course: {
    code: string;
    title: string;
    capacity: number;
  };
}

export default function LecturerSessions() {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["lecturer-sessions"],
    queryFn: api.sessions.getLecturerSessions,
  });

  const sessions: Session[] = data?.sessions || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900">My Classes</h1>
            <p className="text-muted-foreground">View and manage your lecture sessions.</p>
          </div>
          <button 
            onClick={() => setLocation("/lecturer/dashboard")}
            className="bg-primary hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Sessions Yet</h3>
            <p className="text-muted-foreground mb-4">Start a new session from the dashboard to begin tracking attendance.</p>
            <button 
              onClick={() => setLocation("/lecturer/dashboard")}
              className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm ${
                    session.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {session.course.code.split(' ')[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {session.course.code}: {session.course.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> 
                        {session.attendanceCount} attended
                      </span>
                      <span>•</span>
                      <span>{session.location}</span>
                      <span>•</span>
                      <span>{new Date(session.startTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {session.isActive && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Live
                    </span>
                  )}
                  <button 
                    onClick={() => setLocation(`/lecturer/session/active?id=${session.id}`)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}