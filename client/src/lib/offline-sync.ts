import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "offline_attendance_queue";

interface OfflineRequest {
    id: string;
    url: string;
    method: string;
    body: any;
    timestamp: number;
}

export const offlineSync = {
    saveRequest: (url: string, method: string, body: any) => {
        const queue = offlineSync.getQueue();
        const request: OfflineRequest = {
            id: crypto.randomUUID(),
            url,
            method,
            body,
            timestamp: Date.now(),
        };
        queue.push(request);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        return request;
    },

    getQueue: (): OfflineRequest[] => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    clearQueue: () => {
        localStorage.removeItem(STORAGE_KEY);
    },

    sync: async () => {
        const queue = offlineSync.getQueue();
        if (queue.length === 0) return;

        const failedRequests: OfflineRequest[] = [];
        let successCount = 0;

        for (const req of queue) {
            try {
                const response = await fetch(`/api${req.url}`, {
                    method: req.method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(req.body),
                });

                if (response.ok) {
                    successCount++;
                } else {
                    failedRequests.push(req);
                }
            } catch (error) {
                failedRequests.push(req);
            }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(failedRequests));

        if (successCount > 0) {
            toast({
                title: "Online Back",
                description: `Synced ${successCount} offline attendance records.`,
            });
        }
    },
};
