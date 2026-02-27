'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, BookOpen } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { getAdminCourses, deleteCourse, createCourse } from '@/actions/admin-courses';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [newCourseOpen, setNewCourseOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseSlug, setNewCourseSlug] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
        const data = await getAdminCourses();
        setCourses(data);
    } catch (e) {
        toast.error("Failed to load courses");
    } finally {
        setLoading(false);
    }
  }

  async function handleDelete(id: string) {
      if (!confirm("Are you sure? This will delete the course and all its lessons.")) return;
      try {
          await deleteCourse(id);
          toast.success("Course deleted");
          loadCourses();
      } catch (e) {
          toast.error("Failed to delete course");
      }
  }

  async function handleCreate() {
      if (!newCourseTitle || !newCourseSlug) {
          toast.error("Please fill in all fields");
          return;
      }

      try {
          const res = await createCourse({ title: newCourseTitle, slug: newCourseSlug });
          if (res.success) {
              toast.success("Course created");
              setNewCourseOpen(false);
              setNewCourseTitle('');
              setNewCourseSlug('');
              // Redirect to edit page
              router.push(`/admin/courses/${res.id}`);
          }
      } catch (e) {
          toast.error("Failed to create course");
      }
  }

  // Auto-generate slug from title
  useEffect(() => {
      if (newCourseTitle) {
          setNewCourseSlug(newCourseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
      }
  }, [newCourseTitle]);

  if (loading) {
      return (
          <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-[#9945FF]" />
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold text-white">Courses</h2>
            <p className="text-gray-400">Manage your learning tracks and content</p>
        </div>
        
        <Dialog open={newCourseOpen} onOpenChange={setNewCourseOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#9945FF] hover:bg-[#7c37cc] text-white">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Course
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#13131a] border-[#2E2E36] text-white">
                <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Course Title</Label>
                        <Input 
                            value={newCourseTitle} 
                            onChange={e => setNewCourseTitle(e.target.value)} 
                            className="bg-[#0A0A0F] border-[#2E2E36]"
                            placeholder="e.g. Advanced Solana Concepts"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug (URL)</Label>
                        <Input 
                            value={newCourseSlug} 
                            onChange={e => setNewCourseSlug(e.target.value)} 
                            className="bg-[#0A0A0F] border-[#2E2E36]"
                            placeholder="e.g. advanced-solana-concepts"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setNewCourseOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} className="bg-[#9945FF] hover:bg-[#7c37cc]">Create Course</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {courses.map(course => (
            <Card key={course.id} className="bg-[#13131a] border-[#2E2E36] hover:border-[#9945FF]/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-xl text-white flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-[#9945FF]" />
                            {course.title}
                        </CardTitle>
                        <CardDescription>{course.description || "No description provided."}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                         <Link href={`/admin/courses/${course.id}`}>
                            <Button variant="outline" size="sm" className="border-[#2E2E36] hover:bg-[#2E2E36] hover:text-white">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </Link>
                        <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(course.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 text-sm text-gray-500">
                        <span>{course.modules?.length || 0} Modules</span>
                        <span>•</span>
                        <span>{course.difficulty}</span>
                        <span>•</span>
                        <span>{course.duration}</span>
                    </div>
                </CardContent>
            </Card>
        ))}

        {courses.length === 0 && (
            <div className="text-center py-12 text-gray-500 border border-dashed border-[#2E2E36] rounded-lg">
                No courses found. Create your first one!
            </div>
        )}
      </div>
    </div>
  );
}
