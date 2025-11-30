import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Plus, BookOpen, Loader2, X, Users, Building2 } from "lucide-react";
import { UNILORIN_DEPARTMENTS } from "@shared/schema";

interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
  capacity: number;
}

export default function LecturerCourses() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: "",
    title: "",
    department: "",
    capacity: 200,
  });

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: api.courses.getAll,
  });

  const createCourseMutation = useMutation({
    mutationFn: api.courses.create,
    onSuccess: () => {
      toast({ title: "Course Created", description: "Your course has been added successfully." });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setShowAddModal(false);
      setNewCourse({ code: "", title: "", department: "", capacity: 200 });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const courses: Course[] = coursesData?.courses || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.code || !newCourse.title || !newCourse.department) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createCourseMutation.mutate(newCourse);
  };

  const departmentOptions = UNILORIN_DEPARTMENTS.map(d => ({
    value: d.name,
    label: `${d.code} - ${d.name}`,
    faculty: d.faculty,
  }));

  const groupedByFaculty = departmentOptions.reduce((acc, dept) => {
    if (!acc[dept.faculty]) {
      acc[dept.faculty] = [];
    }
    acc[dept.faculty].push(dept);
    return acc;
  }, {} as Record<string, typeof departmentOptions>);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900">Manage Courses</h1>
            <p className="text-muted-foreground">Add and manage courses for your department.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#1a1f6c] hover:bg-[#141852] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a1f6c]" />
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Courses Yet</h3>
            <p className="text-muted-foreground mb-4">Add your first course to start creating attendance sessions.</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-[#1a1f6c] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#141852] transition-colors"
            >
              Add Your First Course
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div key={course.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:border-[#1a1f6c]/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#1a1f6c]/10 flex items-center justify-center text-[#1a1f6c] font-bold text-sm">
                    {course.code.split(' ')[0] || course.code.substring(0, 3)}
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{course.code}</h3>
                <p className="text-sm text-muted-foreground mb-3">{course.title}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {course.department || "No department"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {course.capacity} students
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add New Course</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Course Code *</label>
                  <input 
                    type="text"
                    required
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({...newCourse, code: e.target.value.toUpperCase()})}
                    placeholder="e.g., CSC 101"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Course Title *</label>
                  <input 
                    type="text"
                    required
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    placeholder="e.g., Introduction to Computer Science"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Department *</label>
                  <select
                    required
                    value={newCourse.department}
                    onChange={(e) => setNewCourse({...newCourse, department: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none"
                  >
                    <option value="">Select Department</option>
                    {Object.entries(groupedByFaculty).map(([faculty, depts]) => (
                      <optgroup key={faculty} label={faculty}>
                        {depts.map(dept => (
                          <option key={dept.value} value={dept.value}>{dept.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Class Capacity</label>
                  <input 
                    type="number"
                    min="1"
                    max="2000"
                    value={newCourse.capacity}
                    onChange={(e) => setNewCourse({...newCourse, capacity: parseInt(e.target.value) || 200})}
                    placeholder="200"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#1a1f6c] focus:ring-2 focus:ring-[#1a1f6c]/20 outline-none"
                  />
                  <p className="text-xs text-muted-foreground">Maximum number of students expected in this class</p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex gap-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  className="flex-1 px-4 py-3 bg-[#1a1f6c] text-white font-medium rounded-lg hover:bg-[#141852] transition-colors disabled:opacity-50"
                >
                  {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
