import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Loader2, CheckCircle2, XCircle, Wifi, Smartphone } from "lucide-react";
import mapImage from "@assets/generated_images/geofence_map_visualization.png";

export default function StudentAttendance() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"scanning" | "success" | "error">("scanning");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step === "scanning") {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setStep("success");
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => setLocation("/student/dashboard")}
            className="text-sm text-muted-foreground hover:text-primary mb-2"
          >
            &larr; Back to Dashboard
          </button>
          <h1 className="text-2xl font-serif font-bold text-slate-900">GNS 312 Attendance</h1>
          <p className="text-muted-foreground">Lecture Theatre A • Dr. Adebayo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          {/* Map Visualization Section */}
          <div className="relative h-64 bg-slate-100 overflow-hidden">
            <img 
              src={mapImage} 
              alt="Geofence Map" 
              className="w-full h-full object-cover opacity-80"
            />
            
            {/* Radar Effect */}
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="relative">
                 <div className="w-4 h-4 bg-primary rounded-full z-10 relative shadow-[0_0_0_4px_rgba(255,255,255,0.5)]" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-primary/30 rounded-full animate-ping" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-primary/10 rounded-full" />
               </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
              <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-md text-xs font-medium shadow-sm flex items-center gap-2">
                <Wifi className="w-3 h-3 text-green-500" />
                GPS Signal: Strong
              </div>
              <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-md text-xs font-medium shadow-sm flex items-center gap-2">
                <Smartphone className="w-3 h-3 text-primary" />
                Device Verified
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="p-8 text-center">
            {step === "scanning" && (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Verifying Location...</h2>
                    <p className="text-slate-500">Please stay within the lecture hall.</p>
                  </div>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">Validating geofence coordinates (Accuracy: 3m)</p>
              </div>
            )}

            {step === "success" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Attendance Marked!</h2>
                  <p className="text-slate-500 mt-2">You have successfully checked in for GNS 312.</p>
                  <p className="text-sm text-muted-foreground mt-1">Time: 10:14 AM • ID: #Att-8291</p>
                </div>
                <button 
                  onClick={() => setLocation("/student/dashboard")}
                  className="w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}

            {step === "error" && (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Verification Failed</h2>
                  <p className="text-slate-500 mt-2">You appear to be outside the classroom.</p>
                </div>
                <button 
                  onClick={() => { setStep("scanning"); setProgress(0); }}
                  className="w-full bg-slate-900 text-white font-medium py-3 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}