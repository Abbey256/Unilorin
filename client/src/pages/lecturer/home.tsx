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

const UNILORIN_LOCATIONS = [
  { name: "Unilorin Main Gate", lat: "8.4799", lng: "4.5418", radius: 200 },
  { name: "Lecture Theatre 1 (LT1)", lat: "8.4820", lng: "4.5450", radius: 150 },
  { name: "Lecture Theatre 2 (LT2)", lat: "8.4810", lng: "4.5430", radius: 150 },
  { name: "University Auditorium", lat: "8.4840", lng: "4.5480", radius: 200 },
  { name: "CBT Centre", lat: "8.4850", lng: "4.5490", radius: 200 },
  { name: "Faculty of Science", lat: "8.4830", lng: "4.5460", radius: 200 },
  { name: "Faculty of Engineering", lat: "8.4800", lng: "4.5400", radius: 200 },
  { name: "Whole Campus (Testing Mode)", lat: "8.4820", lng: "4.5450", radius: 2000 },
];

export default function LecturerHome() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");
  const [sessionDuration, setSessionDuration] = useState("30"); // Default 30 mins
  const [locationSource, setLocationSource] = useState<"gps" | "preset">("preset");
  const [selectedPreset, setSelectedPreset] = useState(UNILORIN_LOCATIONS[0].name);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  const detectLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false);
        setDetectedLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        setIsGettingLocation(false);
        setLocationError("Could not get your location. Please check permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCreateSession = () => {
    if (!selectedCourse || !sessionLocation) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    if (locationSource === "preset") {
      const preset = UNILORIN_LOCATIONS.find(l => l.name === selectedPreset) || UNILORIN_LOCATIONS[0];
      createSessionMutation.mutate({
        courseId: selectedCourse,
        location: sessionLocation,
        latitude: preset.lat,
        longitude: preset.lng,
        geofenceRadius: preset.radius,
        duration: sessionDuration === "manual" ? null : parseInt(sessionDuration),
      });
      return;
    }

    // For GPS source, we must have detected location
    if (!detectedLocation) {
      toast({ title: "Error", description: "Please detect your location first", variant: "destructive" });
      return;
    }

    createSessionMutation.mutate({
      courseId: selectedCourse,
      location: sessionLocation,
      latitude: detectedLocation.lat.toString(),
      longitude: detectedLocation.lng.toString(),
      geofenceRadius: 100, // Enforce 100m radius as per spec
      duration: sessionDuration === "manual" ? null : parseInt(sessionDuration),
    });
  };

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

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Duration</label>
                <select
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none"
                >
                  <option value="5">5 Minutes</option>
                  <option value="10">10 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="manual">Manual (No Limit)</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">GPS Geofencing</p>
                  <p className="text-xs text-blue-700">
                    {locationSource === "gps"
                      ? "Using your current location. Students must be within 200m."
                      : `Using preset coordinates. Students must be within ${UNILORIN_LOCATIONS.find(l => l.name === selectedPreset)?.radius || 200}m.`}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-sm font-medium text-slate-700 block">Location Source</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setLocationSource("gps");
                      if (!detectedLocation) detectLocation();
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${locationSource === "gps"
                      ? "bg-[#1a1f6c] text-white border-[#1a1f6c]"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    Auto-Detect (GPS)
                  </button>
                  <button
                    onClick={() => setLocationSource("preset")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${locationSource === "preset"
                      ? "bg-[#1a1f6c] text-white border-[#1a1f6c]"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    Select Classroom
                  </button>
                </div>

                {locationSource === "preset" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <select
                      value={selectedPreset}
                      onChange={(e) => setSelectedPreset(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none bg-slate-50"
                    >
                      {UNILORIN_LOCATIONS.map((loc) => (
                        <option key={loc.name} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1 ml-1">
                      Using preset coordinates for {selectedPreset}.
                    </p>
                  </div>
                )}

                {locationSource === "gps" && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Detected Coordinates</span>
                      <button
                        onClick={detectLocation}
                        disabled={isGettingLocation}
                        className="text-xs text-[#1a1f6c] hover:underline disabled:opacity-50"
                      >
                        {isGettingLocation ? "Detecting..." : "Refresh"}
                      </button>
                    </div>

                    {locationError ? (
                      <p className="text-xs text-red-500">{locationError}</p>
                    ) : detectedLocation ? (
                      <div className="font-mono text-xs text-slate-600">
                        <p>Lat: {detectedLocation.lat.toFixed(6)}</p>
                        <p>Lng: {detectedLocation.lng.toFixed(6)}</p>
                        <p className="text-green-600 mt-1">✓ Ready to start session</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Click Refresh to detect location...</p>
                    )}
                  </div>
                )}
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
