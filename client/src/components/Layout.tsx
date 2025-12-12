import { useLocation } from "wouter";
import { LayoutDashboard, BookOpen, LogOut, User, GraduationCap, Plus, History, Menu, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
const logo = "/Unilorinlogo.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const isLecturer = location.startsWith("/lecturer");

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: api.auth.me,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.clear();
      setLocation("/");
    },
  });

  const user = userData?.user;

  const handleNavigation = (path: string) => {
    setLocation(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-white border-r border-border hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 flex items-center gap-3 border-b border-border/50 bg-[#1a1f6c]">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <img src={logo} alt="University of Ilorin" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg text-white tracking-tight">UniAttend</h1>
            <p className="text-xs text-blue-200">Unilorin</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
            Menu
          </div>

          {isLecturer ? (
            <>
              <button
                onClick={() => handleNavigation("/lecturer/dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left ${location === '/lecturer/dashboard' ? 'bg-[#1a1f6c]/10 text-[#1a1f6c]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => handleNavigation("/lecturer/sessions")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left ${location.includes('/sessions') ? 'bg-[#1a1f6c]/10 text-[#1a1f6c]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <BookOpen className="w-4 h-4" />
                My Classes
              </button>
              <button
                onClick={() => handleNavigation("/lecturer/courses")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left ${location === '/lecturer/courses' ? 'bg-[#1a1f6c]/10 text-[#1a1f6c]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Plus className="w-4 h-4" />
                Manage Courses
              </button>
            </>
          ) : user?.role === "admin" ? (
            <>
              <button
                onClick={() => handleNavigation("/admin/dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left ${location === '/admin/dashboard' ? 'bg-[#1a1f6c]/10 text-[#1a1f6c]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => handleNavigation("/admin/faculties")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left ${location === '/admin/faculties' ? 'bg-[#1a1f6c]/10 text-[#1a1f6c]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <GraduationCap className="w-4 h-4" />
                Faculties
              </button>
              <button
                onClick={() => handleNavigation("/admin/departments")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left ${location === '/admin/departments' ? 'bg-[#1a1f6c]/10 text-[#1a1f6c]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <BookOpen className="w-4 h-4" />
                Departments
              </button>
              <button
                onClick={() => handleNavigation("/admin/users")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left ${location === '/admin/users' ? 'bg-[#1a1f6c]/10 text-[#1a1f6c]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <User className="w-4 h-4" />
                Users
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavigation("/student/dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left ${location === '/student/dashboard' ? 'bg-[#1a1f6c]/10 text-[#1a1f6c]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => handleNavigation("/student/history")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left ${location === '/student/history' ? 'bg-[#1a1f6c]/10 text-[#1a1f6c]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <History className="w-4 h-4" />
                Attendance History
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#1a1f6c]/10 flex items-center justify-center text-[#1a1f6c]">
              {isLecturer ? <User className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name || (isLecturer ? "Lecturer" : "Student")}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.matricNumber || user?.staffId || "University of Ilorin"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#1a1f6c] border-b border-border z-20 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <img src={logo} alt="University of Ilorin" className="w-6 h-6 object-contain" />
          </div>
          <h1 className="font-serif font-bold text-lg text-white">UniAttend</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white p-2"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg" onClick={e => e.stopPropagation()}>
            <nav className="p-4 space-y-2">
              {isLecturer ? (
                <>
                  <button
                    onClick={() => handleNavigation("/lecturer/dashboard")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-left hover:bg-muted"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigation("/lecturer/sessions")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-left hover:bg-muted"
                  >
                    <BookOpen className="w-4 h-4" />
                    My Classes
                  </button>
                  <button
                    onClick={() => handleNavigation("/lecturer/courses")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-left hover:bg-muted"
                  >
                    <Plus className="w-4 h-4" />
                    Manage Courses
                  </button>
                </>
              ) : user?.role === "admin" ? (
                <>
                  <button
                    onClick={() => handleNavigation("/admin/dashboard")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-left hover:bg-muted"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigation("/admin/faculties")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-left hover:bg-muted"
                  >
                    <GraduationCap className="w-4 h-4" />
                    Faculties
                  </button>
                  <button
                    onClick={() => handleNavigation("/admin/departments")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-left hover:bg-muted"
                  >
                    <BookOpen className="w-4 h-4" />
                    Departments
                  </button>
                  <button
                    onClick={() => handleNavigation("/admin/users")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-left hover:bg-muted"
                  >
                    <User className="w-4 h-4" />
                    Users
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigation("/student/dashboard")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-left hover:bg-muted"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigation("/student/history")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-left hover:bg-muted"
                  >
                    <History className="w-4 h-4" />
                    Attendance History
                  </button>
                </>
              )}
              <hr className="my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-64 min-h-screen pt-16 md:pt-0 bg-slate-50/50">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
