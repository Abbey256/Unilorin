// Define the production URL for the native app
// When running in browser, use relative path to leverage proxy/same-origin
// ROBUST FIX: Only use relative path if we are EXPLICITLY on localhost:5000 (Dev)
// otherwise, assume we are on mobile or production and need the full URL.
const isLocalDev = window.location.hostname === "localhost" && window.location.port === "5000";
const API_BASE_URL = isLocalDev ? "" : "https://unilorin.onrender.com";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}/api${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }
      return data;
    } else {
      // Received non-JSON response (likely HTML error page or 404)
      const text = await response.text();
      console.error("API Error: Received non-JSON response", text.substring(0, 500));
      throw new Error(`Server returned ${response.status} ${response.statusText} (Not JSON)`);
    }
  } catch (error: any) {
    console.error("Fetch API Error:", error);
    throw error;
  }
}

export const api = {
  auth: {
    login: (identifier: string, password: string, role: string) =>
      fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password, role }),
      }),
    register: (data: any) =>
      fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...data, deviceId: getDeviceId() }),
      }),
    logout: () =>
      fetchApi("/auth/logout", {
        method: "POST",
      }),
    me: () => fetchApi("/auth/me"),
  },
  courses: {
    getAll: () => fetchApi("/courses"),
    create: (data: any) =>
      fetchApi("/courses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  analytics: {
    getLecturerStats: () => fetchApi("/analytics/lecturer"),
  },
  sessions: {
    getActive: (courseIdOrCode: string) => fetchApi(`/sessions/active/${courseIdOrCode}`),
    getLecturerSessions: () => fetchApi("/sessions/lecturer"),
    create: (data: any) =>
      fetchApi("/sessions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    end: (sessionId: string) =>
      fetchApi(`/sessions/${sessionId}/end`, {
        method: "POST",
      }),
  },
  attendance: {
    mark: async (data: any) => {
      try {
        return await fetchApi("/attendance", {
          method: "POST",
          body: JSON.stringify(data),
        });
      } catch (error) {
        if (!navigator.onLine) {
          const { offlineSync } = await import("./offline-sync");
          offlineSync.saveRequest("/attendance", "POST", data);
          return {
            record: { ...data, status: "pending_sync", markedAt: new Date().toISOString() },
            message: "Offline: Attendance saved. Will sync when online."
          };
        }
        throw error;
      }
    },
    getBySession: (sessionId: string) =>
      fetchApi(`/attendance/session/${sessionId}`),
    getStudentHistory: () => fetchApi("/attendance/student"),
    getStudentStats: () => fetchApi("/attendance/stats"),
  },
  admin: {
    getUsers: () => fetchApi("/admin/users"),
    toggleUserStatus: (userId: string, isActive: boolean) =>
      fetchApi(`/admin/users/${userId}/toggle-status`, {
        method: "POST",
        body: JSON.stringify({ isActive }),
      }),
    getSemesters: () => fetchApi("/admin/semesters"),
    createSemester: (data: any) =>
      fetchApi("/admin/semesters", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    toggleSemesterStatus: (semesterId: string, isActive: boolean) =>
      fetchApi(`/admin/semesters/${semesterId}/toggle-status`, {
        method: "POST",
        body: JSON.stringify({ isActive }),
      }),
  },
};

import { Preferences } from "@capacitor/preferences";

export const MobileDeviceManager = {
  async initialize() {
    // Sync Preferences <-> LocalStorage
    // This allows sync access (via localStorage) but adds persistence (via Preferences)
    try {
      const { value: prefId } = await Preferences.get({ key: "device_id" });
      let localId = localStorage.getItem("deviceId");

      if (prefId && !localId) {
        // Restore from Prefs
        localStorage.setItem("deviceId", prefId);
        localId = prefId;
      } else if (!prefId && localId) {
        // Save to Prefs
        await Preferences.set({ key: "device_id", value: localId });
      } else if (!prefId && !localId) {
        // Generate new
        const newId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("deviceId", newId);
        await Preferences.set({ key: "device_id", value: newId });
      } else if (prefId && localId && prefId !== localId) {
        // Conflict: Trust Preferences (Harder to wipe)
        localStorage.setItem("deviceId", prefId);
      }
    } catch (e) {
      console.error("Device Manager Init Failed", e);
    }
  },

  getDeviceId(): string {
    // Fallback to purely random if not init yet (should be init in App.tsx)
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("deviceId", id);
      // We try to async save it for next time
      Preferences.set({ key: "device_id", value: id }).catch(console.error);
    }
    return id;
  }
};

export function getDeviceId(): string {
  return MobileDeviceManager.getDeviceId();
}

import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export async function getCurrentPosition(): Promise<GeolocationPosition> {
  // If running on a native device (Android/iOS), use the Native Geolocation Plugin
  if (Capacitor.isNativePlatform()) {
    try {
      const permissionStatus = await Geolocation.checkPermissions();

      if (permissionStatus.location !== 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
        if (requestStatus.location !== 'granted') {
          throw new Error("Location permission denied. Please enable it in app settings.");
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      // Convert Capacitor position to standard GeolocationPosition format
      return {
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        },
        timestamp: position.timestamp
      } as GeolocationPosition;

    } catch (error: any) {
      console.error("Native GPS Error:", error);
      throw new Error(error.message || "Failed to get native location.");
    }
  }

  // Fallback to Web Geolocation API for browser
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        let errorMessage = "Unknown location error";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please check your GPS signal.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please move to an open area and try again.";
            break;
        }

        // Retry logic for timeout or position unavailable
        if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
          console.log("Retrying location with relaxed settings...");
          navigator.geolocation.getCurrentPosition(
            resolve,
            (retryError) => {
              // If it fails again, use the specific error message
              reject(new Error(errorMessage));
            },
            {
              enableHighAccuracy: false, // Try with lower accuracy (WiFi/Cell)
              timeout: 20000,
              maximumAge: 10000,
            }
          );
        } else {
          reject(new Error(errorMessage));
        }
      },
      options
    );
  });
}
