import Layout from "@/components/Layout";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, BookOpen, Loader2, Users, Plus, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminCourses() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const queryClient = useQueryClient();

    const [newCourse, setNewCourse] = useState({
        code: "",
        title: "",
        department: "",
        lecturerId: "",
        capacity: "200"
    });

    const { data: coursesData, isLoading } = useQuery({
        queryKey: ["courses"],
        queryFn: api.courses.getAll,
    });

    const { data: usersData } = useQuery({
        queryKey: ["admin-users"],
        queryFn: api.admin.getUsers,
    });

    const { data: departmentsData } = useQuery({
        queryKey: ["departments"],
        queryFn: api.departments.getAll
    });

    const courses = coursesData?.courses || [];

    const users = usersData?.users || [];
    const departments = departmentsData?.departments || [];
    const lecturers = users.filter((u: any) => u.role === "lecturer");

    const getLecturerName = (lecturerId: string) => {
        const lecturer = users.find((u: any) => u.id === lecturerId);
        return lecturer ? lecturer.name : "Unknown";
    };

    const filteredCourses = courses.filter((course: any) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.department && course.department.toLowerCase().includes(searchTerm.toLowerCase()))
            (course.department && course.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await api.courses.create({
                ...newCourse,
                capacity: parseInt(newCourse.capacity)
            });
            toast({ title: "Success", description: "Course created successfully" });
            setIsCreateOpen(false);
            setNewCourse({ code: "", title: "", department: "", lecturerId: "", capacity: "200" });
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const file = formData.get("file") as File;
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await api.admin.upload("courses", file);
            toast({
                title: "Upload Complete",
                description: `${result.message} (${result.successCount} added, ${result.errorCount} failed)`
            });
            setIsUploadOpen(false);
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-slate-900">Course Management</h1>
                        <p className="text-muted-foreground">View all courses and assigned lecturers.</p>
                    </div>

                    <div className="flex gap-2">
                        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Bulk Upload
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Upload Courses</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleUpload} className="space-y-4">
                                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-center">
                                        <FileSpreadsheet className="w-10 h-10 text-slate-300 mb-4" />
                                        <Label htmlFor="file" className="cursor-pointer bg-[#1a1f6c] text-white px-4 py-2 rounded-md hover:bg-[#141852]">
                                            Choose Excel/CSV
                                        </Label>
                                        <Input id="file" name="file" type="file" accept=".csv,.xlsx" className="hidden" required />
                                        <p className="text-xs text-muted-foreground mt-2">Required: code, title, department, lecturer_staff_id (or email)</p>
                                    </div>
                                    <Button type="submit" className="w-full bg-[#1a1f6c]" disabled={isUploading}>
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Upload"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#1a1f6c] text-white hover:bg-[#141852]">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Course
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Course</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Course Code</Label>
                                            <Input
                                                placeholder="e.g. CSC 202"
                                                value={newCourse.code}
                                                onChange={e => setNewCourse({ ...newCourse, code: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Capacity</Label>
                                            <Input
                                                type="number"
                                                value={newCourse.capacity}
                                                onChange={e => setNewCourse({ ...newCourse, capacity: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Course Title</Label>
                                        <Input
                                            placeholder="e.g. Intro to Programming"
                                            value={newCourse.title}
                                            onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Select onValueChange={(val) => setNewCourse({ ...newCourse, department: val })} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map((d: any) => (
                                                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Assign Lecturer</Label>
                                        <Select onValueChange={(val) => setNewCourse({ ...newCourse, lecturerId: val })} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Lecturer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {lecturers.map((l: any) => (
                                                    <SelectItem key={l.id} value={l.id}>{l.name} ({l.staffId})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="submit" className="w-full bg-[#1a1f6c]" disabled={isCreating}>
                                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Create Course"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
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
            </div >
        </Layout >
    );
}
