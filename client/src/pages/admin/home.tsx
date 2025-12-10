import Layout from "@/components/Layout";
import { Link, useLocation } from "wouter";
import { Users, BookOpen, Calendar, Settings, ShieldAlert, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminHome() {
    const [, setLocation] = useLocation();

    const { data: usersData } = useQuery({
        queryKey: ["admin-users"],
        queryFn: api.admin.getUsers,
    });

    const { data: coursesData } = useQuery({
        queryKey: ["courses"],
        queryFn: api.courses.getAll,
    });

    const { data: semestersData } = useQuery({
        queryKey: ["admin-semesters"],
        queryFn: api.admin.getSemesters,
    });

    const users = usersData?.users || [];
    const courses = coursesData?.courses || [];
    const semesters = semestersData?.semesters || [];
    const activeSemester = semesters.find((s: any) => s.isActive);

    const studentsCount = users.filter((u: any) => u.role === "student").length;
    const lecturersCount = users.filter((u: any) => u.role === "lecturer").length;

    return (
        <Layout>
            <div className="space-y-8">
                <header>
                    <h1 className="text-3xl font-serif font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-muted-foreground">System overview and management.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Users</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-slate-900">{users.length}</span>
                            <div className="text-xs text-muted-foreground mb-1.5">
                                <span className="font-medium text-slate-700">{studentsCount}</span> Students • <span className="font-medium text-slate-700">{lecturersCount}</span> Lecturers
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Courses</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-slate-900">{courses.length}</span>
                            <span className="text-xs text-muted-foreground font-medium mb-1.5">Active in system</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Semester</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-xl font-bold text-slate-900 truncate max-w-[200px]">
                                {activeSemester ? activeSemester.name : "None Active"}
                            </span>
                            {activeSemester && (
                                <span className="text-xs text-green-600 font-medium mb-1.5 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Active
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/admin/users">
                        <a className="group block bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:border-[#1a1f6c] transition-colors">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-100 transition-colors">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">User Management</h3>
                            <p className="text-sm text-muted-foreground">Manage students and lecturers. Deactivate accounts.</p>
                        </a>
                    </Link>

                    <Link href="/admin/courses">
                        <a className="group block bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:border-[#1a1f6c] transition-colors">
                            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-4 group-hover:bg-purple-100 transition-colors">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">Course Management</h3>
                            <p className="text-sm text-muted-foreground">View all courses and their assigned lecturers.</p>
                        </a>
                    </Link>

                    <Link href="/admin/settings">
                        <a className="group block bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:border-[#1a1f6c] transition-colors">
                            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 mb-4 group-hover:bg-slate-100 transition-colors">
                                <Settings className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">System Settings</h3>
                            <p className="text-sm text-muted-foreground">Manage semesters and global configurations.</p>
                        </a>
                    </Link>
                </section>
            </div>
        </Layout>
    );
}
