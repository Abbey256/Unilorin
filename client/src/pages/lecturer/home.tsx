import Layout from "@/components/Layout";
import { Link, useLocation } from "wouter";
import { Users, Clock, BarChart3, Plus, Loader2, MapPin, X, BookOpen } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface Course {
  id: string;
  code: string;
  title: string;
  capacity: number;
  department: string;
}

interface Session {
  id: string;
  courseId: string;
  location: string;
  isActive: boolean;
  startTime: string;
  course: Course;
  attendanceCount: number;
}

export default function LecturerHome() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: api.courses.getAll,
  });

  const { data: sessionsData, isLoading: loadingSessions, refetch: refetchSessions } = useQuery({
    queryKey: ["lecturer-sessions"],
    queryFn: api.sessions.getLecturerSessions,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["lecturer-analytics"],
    queryFn: api.analytics.getLecturerStats,
  });

  const courses: Course[] = coursesData?.courses || [];
  const sessions: Session[] = sessionsData?.sessions || [];
  const activeSession = sessions.find(s => s.isActive);
  const uniqueStudents = analyticsData?.uniqueStudents || 0;

  const createSessionMutation = useMutation({
    mutationFn: (data: any) => api.sessions.create(data),
    onSuccess: (response) => {
      toast({ title: "Session Started", description: "Your attendance session is now live." });
      queryClient.invalidateQueries({ queryKey: ["lecturer-sessions"] });
      setShowNewSessionModal(false);
      setSelectedCourse("");
      setSessionLocation("");
      refetchSessions();
      if (response.session?.id) {
        setLocation(`/lecturer/session/active?id=${response.session.id}`);
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: (sessionId: string) => api.sessions.end(sessionId),
    onSuccess: () => {
      toast({ title: "Session Ended", description: "The attendance session has been closed." });
      queryClient.invalidateQueries({ queryKey: ["lecturer-sessions"] });
      refetchSessions();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateSession = () => {
    if (!selectedCourse || !sessionLocation) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsGettingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsGettingLocation(false);
          createSessionMutation.mutate({
            courseId: selectedCourse,
            location: sessionLocation,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
            geofenceRadius: 100,
          });
        },
        (error) => {
          setIsGettingLocation(false);
          toast({
            title: "Location Error",
            description: "Could not get your location. Using default coordinates for Unilorin.",
            variant: "destructive"
          });
          createSessionMutation.mutate({
            courseId: selectedCourse,
            location: sessionLocation,
            latitude: "8.4799",
            longitude: "4.5418",
            geofenceRadius: 100,
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsGettingLocation(false);
      createSessionMutation.mutate({
        courseId: selectedCourse,
        location: sessionLocation,
        latitude: "8.4799",
        longitude: "4.5418",
        geofenceRadius: 100,
      });
    }
  };

  // const totalStudents = courses.reduce((sum, c) => sum + (c.capacity || 0), 0);

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Instructor Dashboard</h1>
            <p className="text-muted-foreground">Manage your classes and attendance reports.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setLocation("/lecturer/courses")}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              Manage Courses
            </button>
            <button
              onClick={() => setShowNewSessionModal(true)}
              disabled={courses.length === 0}
              className="bg-[#1a1f6c] hover:bg-[#141852] text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-new-session"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Students</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">{uniqueStudents}</span>
              <span className="text-xs text-green-600 font-medium mb-1.5">Unique attendees</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Sessions Created</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">{sessions.length}</span>
              <span className="text-xs text-muted-foreground font-medium mb-1.5">This semester</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Sessions</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">{activeSession ? 1 : 0}</span>
              <span className="text-xs text-muted-foreground font-medium mb-1.5">Currently running</span>
            </div>
          </div>
        </div>

        {activeSession && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Active Session</h2>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-50 rounded-lg flex flex-col items-center justify-center text-green-600 border border-green-100">
                    <span className="text-xs font-bold uppercase">NOW</span>
                    <span className="font-bold text-lg">Live</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{activeSession.course.code}: {activeSession.course.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Started {new Date(activeSession.startTime).toLocaleTimeString()}</span>
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {activeSession.attendanceCount} / {activeSession.course.capacity} checked in</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setLocation(`/lecturer/session/active?id=${activeSession.id}`)}
                    className="flex-1 md:flex-none px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    View Live Feed
                  </button>
                  <button
                    onClick={() => endSessionMutation.mutate(activeSession.id)}
                    disabled={endSessionMutation.isPending}
                    className="flex-1 md:flex-none px-6 py-2 bg-red-50 text-red-600 border border-red-100 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    data-testid="button-end-session"
                  >
                    {endSessionMutation.isPending ? "Ending..." : "End Session"}
                  </button>
                </div>
              </div>

              <div className="bg-slate-100 h-1.5 w-full">
                <div className="bg-green-500 h-full transition-all" style={{ width: `${Math.min(100, (activeSession.attendanceCount / activeSession.course.capacity) * 100)}%` }} />
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
            {courses.length > 0 && (
              <button
                onClick={() => setLocation("/lecturer/courses")}
                className="text-sm text-[#1a1f6c] font-medium hover:underline"
              >
                Manage All
              </button>
            )}
          </div>
          {loadingCourses ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#1a1f6c]" />
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Courses Yet</h3>
              <p className="text-muted-foreground mb-4">Add your first course to start creating attendance sessions.</p>
              <button
                onClick={() => setLocation("/lecturer/courses")}
                className="bg-[#1a1f6c] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#141852] transition-colors"
              >
                Add Course
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-muted-foreground font-medium">
                    <tr>
                      <th className="p-4">Course Code</th>
                      <th className="p-4">Course Title</th>
                      <th className="p-4 hidden md:table-cell">Department</th>
                      <th className="p-4">Capacity</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-medium text-slate-900">{course.code}</td>
                        <td className="p-4">{course.title}</td>
                        <td className="p-4 hidden md:table-cell text-muted-foreground">{course.department || "-"}</td>
                        <td className="p-4">{course.capacity}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedCourse(course.id);
                              setShowNewSessionModal(true);
                            }}
                            className="text-[#1a1f6c] hover:underline text-sm font-medium"
                          >
                            Start Session
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Start New Session</h2>
              <button onClick={() => setShowNewSessionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Select Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none"
                  data-testid="select-course"
                >
                  <option value="">Choose a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.code} - {course.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Location</label>
                <input
                  type="text"
                  value={sessionLocation}
                  onChange={(e) => setSessionLocation(e.target.value)}
                  placeholder="e.g., Lecture Theatre A, Room 101"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none"
                  data-testid="input-location"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">GPS Geofencing</p>
                  <p className="text-xs text-blue-700">Your current location will be used as the class geofence center. Students must be within 100 meters to mark attendance.</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={createSessionMutation.isPending || isGettingLocation}
                className="flex-1 px-4 py-3 bg-[#1a1f6c] text-white font-medium rounded-lg hover:bg-[#141852] transition-colors disabled:opacity-50"
                data-testid="button-start-session"
              >
                {isGettingLocation ? "Getting Location..." : createSessionMutation.isPending ? "Starting..." : "Start Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
