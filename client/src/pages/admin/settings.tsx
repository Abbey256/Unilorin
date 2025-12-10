import Layout from "@/components/Layout";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Calendar, Plus, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AdminSettings() {
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();
    const [showNewSemesterModal, setShowNewSemesterModal] = useState(false);

    // New Semester Form State
    const [newSemesterName, setNewSemesterName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const { data: semestersData, isLoading } = useQuery({
        queryKey: ["admin-semesters"],
        queryFn: api.admin.getSemesters,
    });

    const createSemesterMutation = useMutation({
        mutationFn: (data: any) => api.admin.createSemester(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-semesters"] });
            toast({ title: "Semester Created", description: "New semester has been added." });
            setShowNewSemesterModal(false);
            setNewSemesterName("");
            setStartDate("");
            setEndDate("");
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ semesterId, isActive }: { semesterId: string; isActive: boolean }) =>
            api.admin.toggleSemesterStatus(semesterId, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-semesters"] });
            toast({ title: "Status Updated", description: "Semester status updated." });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const semesters = semestersData?.semesters || [];

    const handleCreateSemester = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSemesterName || !startDate || !endDate) {
            toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
            return;
        }

        createSemesterMutation.mutate({
            name: newSemesterName,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            isActive: false, // Default to inactive, admin must activate manually
        });
    };

    return (
        <Layout>
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-slate-900">System Settings</h1>
                        <p className="text-muted-foreground">Manage academic sessions and global configurations.</p>
                    </div>
                    <button
                        onClick={() => setShowNewSemesterModal(true)}
                        className="bg-[#1a1f6c] hover:bg-[#141852] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Semester
                    </button>
                </header>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-slate-500" />
                            Academic Semesters
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Only one semester can be active at a time. Activating a semester will deactivate all others.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#1a1f6c]" />
                        </div>
                    ) : semesters.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No semesters configured. Create one to get started.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {semesters.map((semester: any) => (
                                <div key={semester.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-slate-900">{semester.name}</h3>
                                            {semester.isActive && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    <CheckCircle className="w-3 h-3" /> Active
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => !semester.isActive && toggleStatusMutation.mutate({ semesterId: semester.id, isActive: true })}
                                        disabled={semester.isActive || toggleStatusMutation.isPending}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${semester.isActive
                                                ? 'bg-slate-100 text-slate-400 cursor-default'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                                    >
                                        {semester.isActive ? "Current" : "Set Active"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showNewSemesterModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">Add New Semester</h2>
                        </div>
                        <form onSubmit={handleCreateSemester} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Semester Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 2024/2025 Rain Semester"
                                    value={newSemesterName}
                                    onChange={(e) => setNewSemesterName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowNewSemesterModal(false)}
                                    className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createSemesterMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-[#1a1f6c] text-white font-medium rounded-lg hover:bg-[#141852] transition-colors disabled:opacity-50"
                                >
                                    {createSemesterMutation.isPending ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
