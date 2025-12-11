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
    // Departments
    createDepartment: (data: any) =>
      fetchApi("/departments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    // Faculties
    createFaculty: (data: any) =>
      fetchApi("/faculties", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  departments: {
    getAll: () => fetchApi("/departments"),
  },
  faculties: {
    getAll: () => fetchApi("/faculties"),
  },
};

import { Preferences } from "@capacitor/preferences";
import { Device } from "@capacitor/device";

export const MobileDeviceManager = {
  async initialize() {
    // 1. Try to get hardware ID (The most persistent)
    try {
      const info = await Device.getId();
      // 'identifier' is the standard property for unique ID in Capacitor Device plugin
      if (info.identifier) {
        const hardwareId = info.identifier;
        localStorage.setItem("deviceId", hardwareId);
        await Preferences.set({ key: "device_id", value: hardwareId });
        console.log("Device Manager: Hardware ID locked", hardwareId);
        return;
      }
    } catch (e) {
      console.error("Device Manager: Failed to get Hardware ID", e);
    }

    // 2. Fallback to Preferences/LocalStorage logic (if Hardware ID fails)
    try {
      const { value: prefId } = await Preferences.get({ key: "device_id" });
      let localId = localStorage.getItem("deviceId");

      if (prefId && !localId) {
        localStorage.setItem("deviceId", prefId);
      } else if (!prefId && localId) {
        await Preferences.set({ key: "device_id", value: localId });
      } else if (!prefId && !localId) {
        const newId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("deviceId", newId);
        await Preferences.set({ key: "device_id", value: newId });
      }
    } catch (e) {
      console.error("Device Manager Init Failed", e);
    }
  },

  getDeviceId(): string {
    // Return what we have in storage (which should be Hardware ID if init ran)
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("deviceId", id);
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
  // If running on a native device (Android/iOS), use the Native Geolocation Plugin with "Smart Sampling"
  if (Capacitor.isNativePlatform()) {
    return new Promise(async (resolve, reject) => {
      let watchId: string | null = null;
      const readings: any[] = [];
      let resolved = false;

      try {
        const permissionStatus = await Geolocation.checkPermissions();
        if (permissionStatus.location !== 'granted') {
          const requestStatus = await Geolocation.requestPermissions();
          if (requestStatus.location !== 'granted') {
            throw new Error("Location permission denied. Please enable it in app settings.");
          }
        }

        // HEURISTIC: Wait up to 6 seconds to find the best signal
        const MAX_WAIT_TIME = 6000;
        const TARGET_ACCURACY = 15; // meters

        // Start watching position (continuous stream)
        watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
          (position, err) => {
            if (err) {
              console.warn("GPS Watch Error:", err);
              return;
            }
            if (position) {
              console.log(`GPS Reading: Lat: ${position.coords.latitude}, Acc: ${position.coords.accuracy}m`);
              readings.push(position);

              // If we hit our target accuracy, return immediately (Fast Path)
              if (position.coords.accuracy <= TARGET_ACCURACY && !resolved) {
                resolved = true;
                if (watchId) Geolocation.clearWatch({ id: watchId });
                resolve(formatPosition(position));
              }
            }
          }
        );

        // Set a timeout to stop watching and pick the best reading
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            if (watchId) Geolocation.clearWatch({ id: watchId });

            if (readings.length === 0) {
              // Failed to get ANY reading in 6 seconds
              reject(new Error("Unable to acquire a GPS signal. Please move to an open area."));
            } else {
              // Sort by accuracy (ascending -> smaller number is better)
              readings.sort((a, b) => a.coords.accuracy - b.coords.accuracy);
              const bestReading = readings[0];
              console.log(`Selected Best Reading: Acc ${bestReading.coords.accuracy}m`);
              resolve(formatPosition(bestReading));
            }
          }
        }, MAX_WAIT_TIME);

      } catch (error: any) {
        console.error("Native GPS Error:", error);
        if (watchId && !resolved) Geolocation.clearWatch({ id: watchId });
        reject(new Error(error.message || "Failed to get native location."));
      }
    });
  }

  // Fallback to Web Geolocation API for browser
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        let errorMessage = "Unknown location error";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Check GPS.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

function formatPosition(position: any): GeolocationPosition {
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
}
