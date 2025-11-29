import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, GraduationCap, User } from "lucide-react";
import bgImage from "@assets/generated_images/modern_university_campus_background_for_login_screen.png";
import logo from "@assets/generated_images/uniattend_app_logo_icon.png";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await api.auth.login(identifier, password, role);
      
      if (role === "student") {
        setLocation("/student/dashboard");
      } else {
        setLocation("/lecturer/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="University Campus" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-slate-900/90 backdrop-blur-sm" />
      </div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-6"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 pb-6 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner border border-slate-100">
              <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-500 text-sm">Smart Attendance System for Unilorin</p>
          </div>

          {/* Role Toggles */}
          <div className="px-8 mb-6">
            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setRole("student")}
                className={`flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-md transition-all ${role === "student" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <GraduationCap className="w-4 h-4" />
                Student
              </button>
              <button
                onClick={() => setRole("lecturer")}
                className={`flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-md transition-all ${role === "lecturer" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <User className="w-4 h-4" />
                Lecturer
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="px-8 pb-8 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {role === "student" ? "Matric Number" : "Staff ID"}
              </label>
              <input 
                type="text" 
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === "student" ? "18/52HA019" : "UNI/L/001"}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900 placeholder:text-slate-300"
                data-testid="input-identifier"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900 placeholder:text-slate-300"
                data-testid="input-password"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-blue-800 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                data-testid="button-login"
              >
                {isLoading ? "Authenticating..." : "Sign In"}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-center pt-4">
              <a href="#" className="text-xs text-slate-400 hover:text-primary transition-colors">Forgot your credentials?</a>
            </div>
          </form>
        </div>
        
        <p className="text-center text-slate-400 text-xs mt-6">
          &copy; 2025 University of Ilorin. Powered by AWS.
        </p>
      </motion.div>
    </div>
  );
}