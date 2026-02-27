'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateCourse } from '@/actions/admin-courses';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { CurriculumEditor } from '@/components/admin/CurriculumEditor';

interface CourseEditorProps {
  course: any;
}

export function CourseEditor({ course }: CourseEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [formData, setFormData] = useState({
    title: course.title,
    slug: course.slug,
    description: course.description || '',
    difficulty: course.difficulty || 'Beginner',
    duration: course.duration || '1h',
    image: course.image || '',
    tags: course.tags?.join(', ') || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tagsArray = formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      await updateCourse(course.id, {
        ...formData,
        tags: tagsArray
      });
      toast.success("Course details saved!");
      router.refresh();
    } catch (e) {
      toast.error("Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
             <Link href="/admin/courses" aria-label="Back to Courses">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
             </Link>
             <div>
                <h2 className="text-2xl font-bold text-white">{formData.title}</h2>
                <p className="text-gray-400 text-sm">Editing Course</p>
             </div>
        </div>
        
        <Button onClick={handleSave} disabled={saving} className="bg-[#9945FF] hover:bg-[#7c37cc]">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#13131a] border border-[#2E2E36] text-gray-400">
          <TabsTrigger value="general" className="data-[state=active]:bg-[#2E2E36] data-[state=active]:text-white">General Info</TabsTrigger>
          <TabsTrigger value="curriculum" className="data-[state=active]:bg-[#2E2E36] data-[state=active]:text-white">Curriculum</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-[#13131a] border-[#2E2E36]">
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Basic details about the course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input name="title" value={formData.title} onChange={handleChange} className="bg-[#0A0A0F] border-[#2E2E36]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input name="slug" value={formData.slug} onChange={handleChange} className="bg-[#0A0A0F] border-[#2E2E36]" />
                  </div>
              </div>

              <div className="space-y-2">
                <Label>Cover Image URL</Label>
                <Input name="image" value={formData.image} onChange={handleChange} className="bg-[#0A0A0F] border-[#2E2E36]" placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" value={formData.description} onChange={handleChange} className="bg-[#0A0A0F] border-[#2E2E36] min-h-[100px]" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Input name="difficulty" value={formData.difficulty} onChange={handleChange} className="bg-[#0A0A0F] border-[#2E2E36]" placeholder="Beginner, Intermediate..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input name="duration" value={formData.duration} onChange={handleChange} className="bg-[#0A0A0F] border-[#2E2E36]" placeholder="e.g. 2h 30m" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (comma separated)</Label>
                    <Input name="tags" value={formData.tags} onChange={handleChange} className="bg-[#0A0A0F] border-[#2E2E36]" />
                  </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum">
             <CurriculumEditor courseId={course.id} modules={course.modules} />
        </TabsContent>
        {/* TODO: Settings Tab for deleting course, etc. */}
      </Tabs>
    </div>
  );
}
