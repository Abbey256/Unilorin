import Layout from "@/components/Layout";
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
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-slate-900">Faculties</h1>
                        <p className="text-muted-foreground">Manage university faculties.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search faculties..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="text-slate-600 border-slate-200">
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
                                    <Button className="bg-[#1a1f6c] hover:bg-[#141852] text-white">
                                        <Plus className="w-4 h-4 mr-2" />
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


        </Layout >
    );
}
