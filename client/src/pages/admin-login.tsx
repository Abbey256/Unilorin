import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import bgImage from "@assets/generated_images/modern_university_campus_background_for_login_screen.png";
const logo = "/Unilorinlogo.png";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function AdminLoginPage() {
    const [, setLocation] = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.auth.login(identifier, password, "admin");

            toast({
                title: "Welcome back, Admin!",
                description: `Logged in as ${response.user.name}`,
            });

            setLocation("/admin/dashboard");
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

    const handleSetupAdmin = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/setup/admin");
            const data = await res.json();
            if (res.ok) {
                toast({
                    title: "Admin Setup",
                    description: data.message,
                });
                if (data.staffId && data.password) {
                    setIdentifier(data.staffId);
                    setPassword(data.password);
                }
            } else {
                throw new Error(data.error || "Setup failed");
            }
        } catch (error: any) {
            toast({
                title: "Setup Failed",
                description: error.message,
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
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4 border-[#1a1f6c]">
                    <div className="p-8 pb-6 text-center">
                        <div className="w-20 h-20 bg-[#1a1f6c] rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg border-4 border-white">
                            <img src={logo} alt="University of Ilorin" className="w-16 h-16 object-contain" />
                        </div>
                        <h1 className="font-serif text-2xl font-bold text-slate-900 mb-2">
                            Admin Portal
                        </h1>
                        <p className="text-slate-500 text-sm">UniAttend - Smart Attendance System</p>
                    </div>

                    <form onSubmit={handleLogin} className="px-8 pb-8 space-y-4">
                        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Restricted Access: This portal is for system administrators only.</span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Staff ID
                            </label>
                            <input
                                type="text"
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="UNI/L/000"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none transition-all text-slate-900 placeholder:text-slate-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none transition-all text-slate-900 placeholder:text-slate-300 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#1a1f6c] hover:bg-[#141852] text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                            >
                                {isLoading ? "Authenticating..." : "Access Portal"}
                                {!isLoading && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={handleSetupAdmin}
                                className="text-xs text-slate-400 hover:text-[#1a1f6c] hover:underline"
                            >
                                Initialize Admin Account
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
