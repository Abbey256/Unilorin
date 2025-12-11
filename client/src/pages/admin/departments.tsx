import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
    Building2,
    Plus,
    ArrowLeft,
    Loader2,
    Search,
    School,
    Upload,
    FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


export default function AdminDepartmentsPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [faculties, setFaculties] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [newDepartment, setNewDepartment] = useState({
        name: "",
        code: "",
        faculty: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [deptData, facultyData] = await Promise.all([
                api.departments.getAll(),
                api.faculties.getAll()
            ]);
            setDepartments(deptData.departments);
            setFaculties(facultyData.faculties);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            await api.admin.createDepartment(newDepartment);
            toast({
                title: "Success",
                description: "Department created successfully",
            });
            setIsOpen(false);
            setNewDepartment({ name: "", code: "", faculty: "" });
            fetchData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create department",
                variant: "destructive",
            });
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
            const result = await api.admin.upload("departments", file);
            toast({
                title: "Upload Complete",
                description: `${result.message} (${result.successCount} added, ${result.errorCount} failed)`,
            });
            if (result.errorCount > 0) {
                console.error("Upload errors:", result.errors);
            }
            setIsUploadOpen(false);
            fetchData();
        } catch (error: any) {
            toast({
                title: "Upload Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.faculty?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-[#1a1f6c] text-white p-6 pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <Button
                            variant="ghost"
                            className="text-white hover:bg-white/10"
                            onClick={() => setLocation("/admin/portal")}
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold">Departments</h1>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search departments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-white/20">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Bulk Upload
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Upload Departments</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleUpload} className="space-y-4">
                                        <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-center">
                                            <FileSpreadsheet className="w-10 h-10 text-slate-300 mb-4" />
                                            <Label htmlFor="file" className="cursor-pointer bg-[#1a1f6c] text-white px-4 py-2 rounded-md hover:bg-[#141852]">
                                                Choose Excel/CSV File
                                            </Label>
                                            <Input
                                                id="file"
                                                name="file"
                                                type="file"
                                                accept=".csv, .xlsx, .xls"
                                                className="hidden"
                                                required
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        toast({ title: "Selected", description: e.target.files[0].name });
                                                    }
                                                }}
                                            />
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Columns required: name, code, faculty
                                            </p>
                                        </div>
                                        <Button type="submit" className="w-full bg-[#1a1f6c]" disabled={isUploading}>
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                            Upload Validation
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-[#d4af37] hover:bg-[#b5952f] text-white">
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add Department
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Department</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreate} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Department Name</Label>
                                            <Input
                                                id="name"
                                                value={newDepartment.name}
                                                onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                                                placeholder="e.g. Computer Science"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="code">Department Code</Label>
                                            <Input
                                                id="code"
                                                value={newDepartment.code}
                                                onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value })}
                                                placeholder="e.g. CSC"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="faculty">Faculty</Label>
                                            <Select
                                                value={newDepartment.faculty}
                                                onValueChange={(val) => setNewDepartment({ ...newDepartment, faculty: val })}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Faculty" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {faculties.map((faculty) => (
                                                        <SelectItem key={faculty.code || faculty.name} value={faculty.name}>
                                                            {faculty.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="submit" className="w-full bg-[#1a1f6c]" disabled={isCreating}>
                                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Create Department
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 pb-12">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-[#1a1f6c] animate-spin" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDepartments.map((dept) => (
                            <motion.div
                                key={dept.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl shadow-sm border border-slate-100 p-6"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-[#1a1f6c]/10 flex items-center justify-center text-[#1a1f6c]">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">
                                        {dept.code}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg mb-1">{dept.name}</h3>
                                <div className="flex items-center text-slate-500 text-sm">
                                    <School className="w-4 h-4 mr-1" />
                                    {dept.faculty}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
