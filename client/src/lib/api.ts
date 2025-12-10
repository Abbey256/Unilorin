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
