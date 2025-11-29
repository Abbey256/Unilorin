import { Link, useLocation } from "wouter";
import { ShieldCheck, LayoutDashboard, BookOpen, LogOut, User, GraduationCap } from "lucide-react";
import logo from "@assets/generated_images/uniattend_app_logo_icon.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isLecturer = location.startsWith("/lecturer");

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <img src={logo} alt="UniAttend Logo" className="w-8 h-8 object-contain" />
          <h1 className="font-serif font-bold text-xl text-primary tracking-tight">UniAttend</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
            Menu
          </div>
          
          {isLecturer ? (
            <>
              <Link href="/lecturer/dashboard">
                <a className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${location === '/lecturer/dashboard' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </a>
              </Link>
              <Link href="/lecturer/sessions">
                <a className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${location.includes('/sessions') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <BookOpen className="w-4 h-4" />
                  My Classes
                </a>
              </Link>
            </>
          ) : (
            <>
              <Link href="/student/dashboard">
                <a className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${location === '/student/dashboard' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </a>
              </Link>
              <Link href="/student/history">
                <a className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${location === '/student/history' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <BookOpen className="w-4 h-4" />
                  Attendance History
                </a>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {isLecturer ? <User className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{isLecturer ? "Dr. Adebayo" : "Olabisi A."}</p>
              <p className="text-xs text-muted-foreground truncate">{isLecturer ? "Lecturer" : "Matric: 18/52HA019"}</p>
            </div>
          </div>
          <Link href="/">
            <a className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </a>
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-border z-20 flex items-center px-4 justify-between">
         <div className="flex items-center gap-2">
          <img src={logo} alt="UniAttend Logo" className="w-6 h-6 object-contain" />
          <h1 className="font-serif font-bold text-lg text-primary">UniAttend</h1>
         </div>
         <div className="flex items-center gap-4">
           <Link href="/">
             <LogOut className="w-5 h-5 text-muted-foreground" />
           </Link>
         </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen pt-16 md:pt-0 bg-slate-50/50">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}