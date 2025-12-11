import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, User, Eye, EyeOff, Fingerprint } from "lucide-react";
import bgImage from "@assets/generated_images/modern_university_campus_background_for_login_screen.png";
const logo = "/Unilorinlogo.png";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

// Biometric Imports
import { NativeBiometric } from "capacitor-native-biometric";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  // Initialize Biometrics on Mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const result = await NativeBiometric.isAvailable();
      // Debug log for users
      console.log("Biometric Result:", result);

      if (result.isAvailable) {
        setIsBiometricAvailable(true);
        // Check for saved credentials
        const { value: savedAuth } = await Preferences.get({ key: 'auth_credentials' });
        if (savedAuth) {
          const creds = JSON.parse(savedAuth);
          promptBiometricLogin(creds);
        }
      } else {
        // Log failure reason if possible
        toast({ title: "Biometric Info", description: `Not available: ${result.biometryType || 'Unknown'}`, duration: 2000 });
      }
    } catch (error: any) {
      console.log("Biometric Check Failed", error);
      toast({ title: "Biometric Error", description: error.message || "Plugin failure", variant: "destructive" });
    }
  };

  const promptBiometricLogin = async (creds: any) => {
    try {
      const verified = await NativeBiometric.verifyIdentity({
        reason: "Log in with your fingerprint",
        title: "Welcome Back",
        subtitle: "Confirm your identity",
      });

      if (verified) {
        await performLogin(creds.identifier, creds.password, creds.role, false); // false = don't save again
      }
    } catch (error) {
      console.log("Biometric cancelled/failed", error);
    }
  };

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    department: "",
  });

  const performLogin = async (id: string, pass: string, r: string, shouldSave: boolean = true) => {
    setIsLoading(true);
    try {
      const response = await api.auth.login(id, pass, r);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${response.user.name}`,
      });

      if (shouldSave && isBiometricAvailable) {
        // Ask to enable biometric
        const confirm = window.confirm("Enable Fingerprint Login for next time?");
        if (confirm) {
          await Preferences.set({
            key: 'auth_credentials',
            value: JSON.stringify({ identifier: id, password: pass, role: r })
          });
        }
      }

      if (r === "student") {
        setLocation("/student/dashboard");
      } else if (r === "lecturer") {
        setLocation("/lecturer/dashboard");
      } else {
        setLocation("/admin/dashboard");
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(identifier, password, role);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...registerData,
        password,
        role,
        ...(role === "student"
          ? { matricNumber: identifier }
          : { staffId: identifier }
        ),
      };

      const response = await api.auth.register(data);

      toast({
        title: "Registration Successful",
        description: `Welcome, ${response.user.name}!`,
      });

      if (role === "student") {
        setLocation("/student/dashboard");
      } else {
        setLocation("/lecturer/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      <div className="absolute inset-0 z-0">
        <img
          src={bgImage}
          alt="University Campus"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1f6c]/80 to-slate-900/90 backdrop-blur-sm" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-6"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 pb-6 text-center">
            <div className="w-20 h-20 bg-[#1a1f6c] rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg border-4 border-white">
              <img src={logo} alt="University of Ilorin" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-slate-900 mb-2">
              {isRegisterMode ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-slate-500 text-sm">UniAttend - Smart Attendance System</p>
            <p className="text-[#1a1f6c] text-xs font-medium mt-1">University of Ilorin</p>
          </div>

          <div className="px-8 mb-6">
            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-lg max-w-[320px] mx-auto">
              <button
                onClick={() => setRole("student")}
                className={`flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-md transition-all ${role === "student" ? "bg-white text-[#1a1f6c] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <GraduationCap className="w-3 h-3" />
                Student
              </button>
              <button
                onClick={() => setRole("lecturer")}
                className={`flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-md transition-all ${role === "lecturer" ? "bg-white text-[#1a1f6c] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <User className="w-3 h-3" />
                Lecturer
              </button>
            </div>
          </div>

          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="px-8 pb-8 space-y-4">
            {isRegisterMode && (
              <>
                <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-[#1a1f6c] focus:bg-white focus:ring-4 focus:ring-[#1a1f6c]/10 outline-none transition-all duration-300 text-slate-900 placeholder:text-slate-400 font-medium"
                  />
                </motion.div>

                <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="john.doe@unilorin.edu.ng"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-[#1a1f6c] focus:bg-white focus:ring-4 focus:ring-[#1a1f6c]/10 outline-none transition-all duration-300 text-slate-900 placeholder:text-slate-400 font-medium"
                  />
                </motion.div>

                <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                    Department
                  </label>
                  <select
                    required
                    value={registerData.department}
                    onChange={(e) => setRegisterData({ ...registerData, department: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-[#1a1f6c] focus:bg-white focus:ring-4 focus:ring-[#1a1f6c]/10 outline-none transition-all duration-300 text-slate-900 font-medium appearance-none"
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Chemical Engineering">Chemical Engineering</option>
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Economics">Economics</option>
                    <option value="Law">Law</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Education">Education</option>
                  </select>
                </motion.div>
              </>
            )}

            <motion.div initial={false} animate={{ y: 0 }} className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                {role === "student" ? "Matric Number" : "Staff ID"}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === "student" ? "18/52HA019" : "UNI/L/001"}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-[#1a1f6c] focus:bg-white focus:ring-4 focus:ring-[#1a1f6c]/10 outline-none transition-all duration-300 text-slate-900 placeholder:text-slate-400 font-medium"
                data-testid="input-identifier"
              />
            </motion.div>

            <motion.div initial={false} animate={{ y: 0 }} className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-[#1a1f6c] focus:bg-white focus:ring-4 focus:ring-[#1a1f6c]/10 outline-none transition-all duration-300 text-slate-900 placeholder:text-slate-400 font-medium pr-12"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a1f6c] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#1a1f6c] to-[#2a3090] hover:shadow-lg hover:shadow-[#1a1f6c]/30 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                data-testid="button-login"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegisterMode ? "Create Account" : "Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>

            {/* Biometric Trigger (if available but not auto-triggered) */}
            {isBiometricAvailable && !isLoading && !isRegisterMode && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const { value: savedAuth } = await Preferences.get({ key: 'auth_credentials' });
                    if (savedAuth) promptBiometricLogin(JSON.parse(savedAuth));
                    else toast({ title: "No biometric data saved", description: "Login manually first to enable." });
                  }}
                  className="flex items-center justify-center gap-2 w-full text-sm text-slate-600 bg-slate-100 py-2 rounded-lg hover:bg-slate-200"
                >
                  <Fingerprint className="w-4 h-4" />
                  Login with Fingerprint
                </button>
              </div>
            )}

            <div className="text-center pt-4 space-y-2">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-sm text-[#1a1f6c] hover:underline font-medium"
              >
                {isRegisterMode ? "Already have an account? Sign In" : "Don't have an account? Register"}
              </button>
            </div>


          </form>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          &copy; 2025 University of Ilorin. Powered by UniAttend.
        </p>
        <p className="text-center text-slate-500 text-xs mt-1 italic">
          "Probitas Doctrina" - Integrity and Learning
        </p>
      </motion.div>
    </div>
  );
}
