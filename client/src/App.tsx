import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import StudentHome from "@/pages/student/home";
import StudentAttendance from "@/pages/student/attendance";
import AdminLogin from "@/pages/admin-login";
import LecturerHome from "@/pages/lecturer/home";
import LecturerSession from "@/pages/lecturer/session";
import LecturerSessions from "@/pages/lecturer/sessions";
import LecturerCourses from "@/pages/lecturer/courses";
import StudentHistory from "@/pages/student/history";
import AdminHome from "@/pages/admin/home";
import AdminUsers from "@/pages/admin/users";
import AdminCourses from "@/pages/admin/courses";
import AdminDepartments from "@/pages/admin/departments";
import AdminFaculties from "@/pages/admin/faculties";
import AdminSettings from "@/pages/admin/settings";
import { MobileDeviceManager } from "@/lib/api";

function Router() {
  useEffect(() => {
    MobileDeviceManager.initialize();
  }, []);

  return (
    <Switch>
      <Route path="/" component={LoginPage} />

      {/* Student Routes */}
      <Route path="/student/dashboard" component={StudentHome} />
      <Route path="/student/attendance/:courseId" component={StudentAttendance} />
      <Route path="/student/history" component={StudentHistory} />

      {/* Lecturer Routes */}
      <Route path="/lecturer/dashboard" component={LecturerHome} />
      <Route path="/lecturer/sessions" component={LecturerSessions} />
      <Route path="/lecturer/session/active" component={LecturerSession} />
      <Route path="/lecturer/courses" component={LecturerCourses} />

      <Route path="/admin/portal" component={AdminLogin} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" component={AdminHome} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/courses" component={AdminCourses} />
      <Route path="/admin/departments" component={AdminDepartments} />
      <Route path="/admin/faculties" component={AdminFaculties} />
      <Route path="/admin/settings" component={AdminSettings} />

      <Route component={NotFound} />
    </Switch>
  );
}

import SplashScreen from "@/components/SplashScreen";
import { useState } from "react";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const handleOnline = async () => {
      const { offlineSync } = await import("@/lib/offline-sync");
      offlineSync.sync();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {showSplash ? (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        ) : (
          <Router />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
