import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Search, Loader2, Upload, FileSpreadsheet } from "lucide-react";

export default function AdminFacultiesPage() {
    const [faculties, setFaculties] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [, setLocation] = useLocation();

    const [newFaculty, setNewFaculty] = useState({
        name: "",
        code: "",
    });

    useEffect(() => {
        fetchFaculties();
    }, []);

    const fetchFaculties = async () => {
        try {
            const data = await api.faculties.getAll();
            setFaculties(data.faculties);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch faculties",
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
            await api.admin.createFaculty(newFaculty);
            toast({
                title: "Success",
                description: "Faculty created successfully",
            });
            setIsOpen(false);
            setNewFaculty({ name: "", code: "" });
            fetchFaculties();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create faculty",
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
            const result = await api.admin.upload("faculties", file);
            toast({
                title: "Upload Complete",
                description: `${result.message} (${result.successCount} added, ${result.errorCount} failed)`,
            });
            if (result.errorCount > 0) {
                console.error("Upload errors:", result.errors);
            }
            setIsUploadOpen(false);
            fetchFaculties();
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

    const filteredFaculties = faculties.filter(faculty =>
        faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faculty.code?.toLowerCase().includes(searchQuery.toLowerCase())
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
                        <h1 className="text-2xl font-bold">Faculties</h1>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search faculties..."
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
                                        <DialogTitle>Upload Faculties</DialogTitle>
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
                                                    // Optional: show selected filename
                                                    if (e.target.files?.[0]) {
                                                        toast({ title: "Selected", description: e.target.files[0].name });
                                                    }
                                                }}
                                            />
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Columns required: name, code
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
                                        Add Faculty
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Faculty</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreate} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Faculty Name</Label>
                                            <Input
                                                id="name"
                                                value={newFaculty.name}
                                                onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                                                placeholder="e.g. Life Sciences"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="code">Faculty Code (3 Letters)</Label>
                                            <Input
                                                id="code"
                                                value={newFaculty.code}
                                                onChange={(e) => setNewFaculty({ ...newFaculty, code: e.target.value })}
                                                placeholder="e.g. LIF"
                                                maxLength={3}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full bg-[#1a1f6c]" disabled={isCreating}>
                                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Create Faculty
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#1a1f6c]" />
                        </div>
                    ) : filteredFaculties.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No faculties found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-700">Name</th>
                                        <th className="p-4 font-semibold text-slate-700">Code</th>
                                        <th className="p-4 font-semibold text-slate-700 w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredFaculties.map((faculty) => (
                                        <tr key={faculty.id} className="hover:bg-slate-50/50">
                                            <td className="p-4 font-medium text-slate-900">{faculty.name}</td>
                                            <td className="p-4 font-mono text-slate-500">{faculty.code || "-"}</td>
                                            <td className="p-4">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <div className="w-4 h-4 rounded-full bg-slate-200" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
