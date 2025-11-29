import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import StudentHome from "@/pages/student/home";
import StudentAttendance from "@/pages/student/attendance";
import LecturerHome from "@/pages/lecturer/home";
import LecturerSession from "@/pages/lecturer/session";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      
      {/* Student Routes */}
      <Route path="/student/dashboard" component={StudentHome} />
      <Route path="/student/attendance/:courseId" component={StudentAttendance} />
      
      {/* Lecturer Routes */}
      <Route path="/lecturer/dashboard" component={LecturerHome} />
      <Route path="/lecturer/session/active" component={LecturerSession} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;