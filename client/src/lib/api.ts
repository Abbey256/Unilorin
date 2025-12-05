export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
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
  },
};

export function getDeviceId(): string {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 30000, // Increased to 30 seconds
      maximumAge: 0,
    };

    // First attempt with high accuracy
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        // If timeout or error, try one more time with slightly relaxed settings
        if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
          console.log("Retrying location with relaxed settings...");
          navigator.geolocation.getCurrentPosition(
            resolve,
            (retryError) => {
              // If it fails again, reject with a clear message
              reject(new Error("Could not get precise location. Please move to an open area and try again."));
            },
            {
              enableHighAccuracy: true, // Still try high accuracy
              timeout: 45000, // Longer timeout for retry
              maximumAge: 5000, // Accept cached position up to 5s old
            }
          );
        } else {
          reject(error);
        }
      },
      options
    );
  });
}
