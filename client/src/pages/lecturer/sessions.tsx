import Layout from "@/components/Layout";
import { useLocation } from "wouter";
import { Plus, Users, ChevronRight, Loader2, Calendar, MapPin, Clock } from "lucide-react";
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
  const activeSessions = sessions.filter(s => s.isActive);
  const pastSessions = sessions.filter(s => !s.isActive);

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
            className="bg-[#1a1f6c] hover:bg-[#141852] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a1f6c]" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Sessions Yet</h3>
            <p className="text-muted-foreground mb-4">Start a new session from the dashboard to begin tracking attendance.</p>
            <button 
              onClick={() => setLocation("/lecturer/dashboard")}
              className="bg-[#1a1f6c] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#141852] transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeSessions.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Active Sessions
                </h2>
                <div className="grid gap-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="bg-white p-6 rounded-xl border-2 border-green-200 shadow-sm flex items-center justify-between group hover:border-green-300 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                          LIVE
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-[#1a1f6c] transition-colors">
                            {session.course.code}: {session.course.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> 
                              {session.attendanceCount} / {session.course.capacity} attended
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Started {new Date(session.startTime).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setLocation(`/lecturer/session/active?id=${session.id}`)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        View Live <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastSessions.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Past Sessions</h2>
                <div className="grid gap-4">
                  {pastSessions.map((session) => (
                    <div key={session.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-[#1a1f6c]/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                          {session.course.code.split(' ')[0] || session.course.code.substring(0, 3)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-[#1a1f6c] transition-colors">
                            {session.course.code}: {session.course.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> 
                              {session.attendanceCount} attended
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(session.startTime).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setLocation(`/lecturer/session/active?id=${session.id}`)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
