'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addLesson, updateLesson } from '@/actions/admin-courses';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';

interface LessonEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  moduleId: string;
  lesson?: any; // If null, creating new
}

export function LessonEditor({ open, onOpenChange, courseId, moduleId, lesson }: LessonEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
      title: '',
      slug: '',
      type: 'text',
      xp: 10,
      content: '', // Markdown
      videoUrl: '',
      initialCode: '',
      testCode: '',
      // TODO: Quiz support
  });

  useEffect(() => {
    if (open && lesson) {
        setFormData({
            title: lesson.title,
            slug: lesson.slug,
            type: lesson.type,
            xp: lesson.xp,
            content: lesson.content || '',
            videoUrl: lesson.videoUrl ?? '', // Use nullish coalescing to ensure empty string if null/undefined
            initialCode: lesson.initialCode || '',
            testCode: lesson.testCode || '',
        });
    } else if (open) {
        // Reset for new
        setFormData({
            title: '',
            slug: '',
            type: 'text',
            xp: 10,
            content: '',
            videoUrl: '',
            initialCode: '',
            testCode: '',
        });
    }
  }, [open, lesson]);

  // Auto-slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const title = e.target.value;
      if (!lesson) { // Only auto-slug for new lessons
         const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
         setFormData(prev => ({ ...prev, title, slug }));
      } else {
         setFormData(prev => ({ ...prev, title }));
      }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
        toast.error("Title and slug are required");
        return;
    }

    setSaving(true);
    try {
        if (lesson) {
            await updateLesson(courseId, moduleId, lesson._id, { ...lesson, ...formData }); // Merge to keep other fields like _id
            toast.success("Lesson updated");
        } else {
            await addLesson(courseId, moduleId, {
                ...formData,
                id: formData.slug // Using slug as ID for compatibility
            });
            toast.success("Lesson added");
        }
        router.refresh();
        onOpenChange(false);
    } catch (e) {
        console.error(e);
        toast.error("Failed to save lesson");
    } finally {
        setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#13131a] border-[#2E2E36] text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{lesson ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={formData.title} onChange={handleTitleChange} className="bg-[#0A0A0F]" />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input value={formData.slug} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, slug: e.target.value})} className="bg-[#0A0A0F]" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                            <SelectTrigger className="bg-[#0A0A0F]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#13131a] border-[#2E2E36]">
                                <SelectItem value="text">Text / Article</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="challenge">Coding Challenge</SelectItem>
                                <SelectItem value="quiz">Quiz</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>XP Reward</Label>
                        <Input type="number" value={formData.xp} onChange={e => setFormData({...formData, xp: parseInt(e.target.value)})} className="bg-[#0A0A0F]" />
                    </div>
                </div>

                {formData.type === 'video' && (
                    <div className="space-y-2">
                        <Label>Video URL</Label>
                        <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="https://..." className="bg-[#0A0A0F]" />
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Content (Markdown)</Label>
                    <Textarea 
                        value={formData.content} 
                        onChange={e => setFormData({...formData, content: e.target.value})} 
                        className="bg-[#0A0A0F] font-mono min-h-[200px]" 
                        placeholder="# Lesson Content..."
                    />
                </div>

                {formData.type === 'challenge' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Initial Code</Label>
                            <Textarea 
                                value={formData.initialCode} 
                                onChange={e => setFormData({...formData, initialCode: e.target.value})} 
                                className="bg-[#0A0A0F] font-mono min-h-[150px]" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Test Code (Jest/Vitest)</Label>
                            <Textarea 
                                value={formData.testCode} 
                                onChange={e => setFormData({...formData, testCode: e.target.value})} 
                                className="bg-[#0A0A0F] font-mono min-h-[150px]" 
                            />
                        </div>
                    </div>
                )}
            </div>

            <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-[#9945FF] hover:bg-[#7c37cc]">
                    {saving ? 'Saving...' : 'Save Lesson'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
