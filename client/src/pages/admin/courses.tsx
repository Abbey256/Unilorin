import Layout from "@/components/Layout";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, BookOpen, Loader2, Users } from "lucide-react";

export default function AdminCourses() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: coursesData, isLoading } = useQuery({
        queryKey: ["courses"],
        queryFn: api.courses.getAll,
    });

    const { data: usersData } = useQuery({
        queryKey: ["admin-users"],
        queryFn: api.admin.getUsers,
    });

    const courses = coursesData?.courses || [];
    const users = usersData?.users || [];

    const getLecturerName = (lecturerId: string) => {
        const lecturer = users.find((u: any) => u.id === lecturerId);
        return lecturer ? lecturer.name : "Unknown";
    };

    const filteredCourses = courses.filter((course: any) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.department && course.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Layout>
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-slate-900">Course Management</h1>
                        <p className="text-muted-foreground">View all courses and assigned lecturers.</p>
                    </div>
                </header>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by course code, title, or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#1a1f6c]" />
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No courses found matching your criteria.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-muted-foreground font-medium">
                                    <tr>
                                        <th className="p-4">Course Code</th>
                                        <th className="p-4">Title</th>
                                        <th className="p-4">Department</th>
                                        <th className="p-4">Lecturer</th>
                                        <th className="p-4">Capacity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCourses.map((course: any) => (
                                        <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-bold text-slate-900">{course.code}</td>
                                            <td className="p-4 font-medium">{course.title}</td>
                                            <td className="p-4 text-muted-foreground">{course.department || "-"}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                                                        {getLecturerName(course.lecturerId).charAt(0)}
                                                    </div>
                                                    <span className="text-slate-700">{getLecturerName(course.lecturerId)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" /> {course.capacity}
                                                </span>
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
