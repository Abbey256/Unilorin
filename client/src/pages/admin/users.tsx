import Layout from "@/components/Layout";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, Shield, ShieldOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminUsers() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "student" | "lecturer" | "admin">("all");

    const { data: usersData, isLoading } = useQuery({
        queryKey: ["admin-users"],
        queryFn: api.admin.getUsers,
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
            api.admin.toggleUserStatus(userId, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            toast({ title: "Status Updated", description: "User account status has been updated." });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const users = usersData?.users || [];

    const filteredUsers = users.filter((user: any) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.matricNumber && user.matricNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.staffId && user.staffId.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = roleFilter === "all" || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    return (
        <Layout>
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-slate-900">User Management</h1>
                        <p className="text-muted-foreground">Manage system access and accounts.</p>
                    </div>
                </header>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, matric no, or staff ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as any)}
                        className="px-4 py-2 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none bg-white"
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Students</option>
                        <option value="lecturer">Lecturers</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#1a1f6c]" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No users found matching your criteria.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-muted-foreground font-medium">
                                    <tr>
                                        <th className="p-4">User Info</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Identifier</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.map((user: any) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-slate-900">{user.name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'lecturer' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-slate-600">
                                                {user.matricNumber || user.staffId || "-"}
                                            </td>
                                            <td className="p-4">
                                                {user.isActive ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                                                        <CheckCircle className="w-3 h-3" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                                                        <XCircle className="w-3 h-3" /> Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                {user.role !== "admin" && (
                                                    <button
                                                        onClick={() => toggleStatusMutation.mutate({ userId: user.id, isActive: !user.isActive })}
                                                        disabled={toggleStatusMutation.isPending}
                                                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                              ${user.isActive
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                                    >
                                                        {user.isActive ? (
                                                            <>
                                                                <ShieldOff className="w-3 h-3" /> Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Shield className="w-3 h-3" /> Activate
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
