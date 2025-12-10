import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Loader2, CheckCircle2, Wifi, Smartphone, AlertTriangle, ArrowLeft } from "lucide-react";
import mapImage from "@assets/generated_images/geofence_map_visualization.png";
import { api, getCurrentPosition, getDeviceId } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function StudentAttendance() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const courseId = params.courseId;
  const [step, setStep] = useState<"initializing" | "scanning" | "success" | "error">("initializing");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ lat: number; lng: number; dist?: number } | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        const cleanCourseId = decodeURIComponent(courseId || '').replace(/%20/g, ' ').replace(/\s+/g, ' ').trim();
        const { session } = await api.sessions.getActive(cleanCourseId);

        if (!session) {
          setErrorMessage("No active session for this class. Please wait for your lecturer to start the session.");
          setStep("error");
          return;
        }

        setSessionId(session.id);
        setStep("scanning");
      } catch (error: any) {
        setErrorMessage(error.message || "Failed to load session. Make sure you're logged in.");
        setStep("error");
      }
    }

    if (courseId) {
      initialize();
    }
  }, [courseId]);

  useEffect(() => {
    if (step === "scanning" && sessionId) {
      const verifyAndMark = async () => {
        try {
          const position = await getCurrentPosition();
          const deviceId = getDeviceId();

          const interval = setInterval(() => {
            setProgress(prev => {
              if (prev >= 90) {
                clearInterval(interval);
                return 90;
              }
              return prev + 5;
            });
          }, 100);

          const response = await api.attendance.mark({
            sessionId,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
            deviceId,
          });

          if (response.record?.status === "pending_sync") {
            setIsOfflineSaved(true);
          }

          clearInterval(interval);
          setProgress(100);
          setTimeout(() => setStep("success"), 500);
        } catch (error: any) {
          // Extract distance if available in error response
          if (error.distance) {
            setDebugInfo(prev => prev ? { ...prev, dist: error.distance } : null);
          }
          setErrorMessage(error.message || "Failed to verify location");
          setStep("error");
        }
      };

      // Initial position check for debug display
      getCurrentPosition().then(pos => {
        setDebugInfo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      }).catch(() => { });

      verifyAndMark();
    }
  }, [step, sessionId]);

  const displayCourseId = decodeURIComponent(courseId || '').replace(/%20/g, ' ');

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setLocation("/student/dashboard")}
            className="text-sm text-muted-foreground hover:text-[#1a1f6c] mb-2 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-serif font-bold text-slate-900">{displayCourseId} Attendance</h1>
          <p className="text-muted-foreground">Mark your attendance for this class</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="relative h-64 bg-slate-100 overflow-hidden">
            <img
              src={mapImage}
              alt="Geofence Map"
              className="w-full h-full object-cover opacity-80"
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-4 h-4 bg-[#1a1f6c] rounded-full z-10 relative shadow-[0_0_0_4px_rgba(255,255,255,0.5)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-[#1a1f6c]/30 rounded-full animate-ping" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#1a1f6c]/10 rounded-full" />
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
              <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-md text-xs font-medium shadow-sm flex items-center gap-2">
                <Wifi className="w-3 h-3 text-green-500" />
                GPS Signal: Strong
              </div>
              <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-md text-xs font-medium shadow-sm flex items-center gap-2">
                <Smartphone className="w-3 h-3 text-[#1a1f6c]" />
                Device Verified
              </div>
            </div>
          </div>

          <div className="p-8 text-center">
            {(step === "initializing" || step === "scanning") && (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-[#1a1f6c] animate-spin" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {step === "initializing" ? "Loading Session..." : "Verifying Location..."}
                    </h2>
                    <p className="text-slate-500">
                      {step === "initializing"
                        ? "Please wait while we load the session details."
                        : "Please stay within the lecture hall."}
                    </p>
                  </div>
                </div>

                {step === "scanning" && (
                  <>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-[#1a1f6c]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">Validating GPS coordinates and device fingerprint</p>
                    {debugInfo && (
                      <div className="text-[10px] text-slate-400 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                        <p>Detected: {debugInfo.lat.toFixed(6)}, {debugInfo.lng.toFixed(6)}</p>
                      </div>
                    )}
                  </>
                )}
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
                  <h2 className="text-2xl font-bold text-slate-900">
                    {isOfflineSaved ? "Attendance Saved (Offline)" : "Attendance Marked!"}
                  </h2>
                  <p className="text-slate-500 mt-2">
                    {isOfflineSaved
                      ? "Your attendance has been saved and will automatically sync when you are back online."
                      : `You have successfully checked in for ${displayCourseId}.`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Time: {new Date().toLocaleTimeString()}</p>
                </div>
                <button
                  onClick={() => setLocation("/student/dashboard")}
                  className="w-full bg-[#1a1f6c] text-white font-medium py-3 rounded-lg hover:bg-[#141852] transition-colors"
                  data-testid="button-return-dashboard"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}

            {step === "error" && (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Verification Failed</h2>
                  <p className="text-slate-500 mt-2">{errorMessage}</p>
                  {debugInfo && debugInfo.dist && (
                    <p className="text-xs text-red-500 font-medium mt-1">
                      Distance to class: {Math.round(debugInfo.dist)}m (Max allowed: 100m)
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLocation("/student/dashboard")}
                    className="flex-1 bg-white border border-slate-200 text-slate-700 font-medium py-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => { setStep("initializing"); setProgress(0); setErrorMessage(""); }}
                    className="flex-1 bg-[#1a1f6c] text-white font-medium py-3 rounded-lg hover:bg-[#141852] transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
