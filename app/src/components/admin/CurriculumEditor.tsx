'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, Edit2, GripVertical, FileText, Code, Video, HelpCircle } from 'lucide-react';
import { addModule, updateModule, deleteModule, addLesson, deleteLesson } from '@/actions/admin-courses';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LessonEditor } from '@/components/admin/LessonEditor';

interface CurriculumEditorProps {
  courseId: string;
  modules: any[];
}

export function CurriculumEditor({ courseId, modules }: CurriculumEditorProps) {
  const router = useRouter();
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  
  // Lesson Editing State
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string, lesson: any } | null>(null);
  const [isAddingLesson, setIsAddingLesson] = useState<string | null>(null); // moduleId

  const handleAddModule = async () => {
      if (!newModuleTitle) return;
      try {
          await addModule(courseId, newModuleTitle);
          setNewModuleTitle('');
          setIsAddingModule(false);
          router.refresh();
          toast.success("Module added");
      } catch (e) {
          toast.error("Failed to add module");
      }
  };

  const handleDeleteModule = async (moduleId: string) => {
      if (!confirm("Delete this module and all its lessons?")) return;
      try {
          await deleteModule(courseId, moduleId);
          router.refresh();
          toast.success("Module deleted");
      } catch (e) {
          toast.error("Failed to delete module");
      }
  };
  
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Modules & Lessons</h3>
            <Button onClick={() => setIsAddingModule(true)} variant="outline" className="border-[#9945FF] text-[#9945FF] hover:bg-[#9945FF] hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Add Module
            </Button>
        </div>

        {/* Add Module Input */}
        {isAddingModule && (
            <div className="flex gap-2 p-4 bg-[#13131a] border border-[#2E2E36] rounded-lg animate-in fade-in slide-in-from-top-2">
                <Input 
                    value={newModuleTitle} 
                    onChange={e => setNewModuleTitle(e.target.value)} 
                    placeholder="Module Title (e.g. Introduction to Anchor)"
                    className="bg-[#0A0A0F]"
                />
                <Button onClick={handleAddModule}>Save</Button>
                <Button variant="ghost" onClick={() => setIsAddingModule(false)}>Cancel</Button>
            </div>
        )}

        {/* Modules List */}
        <Accordion type="single" collapsible className="space-y-4">
            {modules.map((module, index) => (
                <AccordionItem key={module._id} value={module._id} className="border border-[#2E2E36] bg-[#13131a] rounded-lg px-2">
                    <div className="flex items-center justify-between py-2">
                        <AccordionTrigger className="hover:no-underline px-4 flex-1">
                            <span className="font-medium text-white flex items-center gap-2">
                                <span className="text-gray-500 text-sm">#{index + 1}</span>
                                {module.title}
                            </span>
                        </AccordionTrigger>
                        <div className="flex items-center gap-2 px-4">
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={(e) => { e.stopPropagation(); setIsAddingLesson(module._id); }}
                                className="text-gray-400 hover:text-white"
                                aria-label={`Add lesson to ${module.title}`}
                            >
                                <Plus className="h-4 w-4 mr-1" /> Lesson
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={(e) => { e.stopPropagation(); handleDeleteModule(module._id); }}
                                className="text-gray-400 hover:text-red-400"
                                aria-label={`Delete ${module.title}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    
                    <AccordionContent className="px-4 pb-4 border-t border-[#2E2E36] pt-4">
                        <div className="space-y-2">
                            {module.lessons.length === 0 && (
                                <p className="text-gray-500 text-sm italic text-center py-4">No lessons yet.</p>
                            )}
                            
                            {module.lessons.map((lesson: any) => (
                                <div key={lesson._id} className="flex items-center justify-between p-3 bg-[#0A0A0F] rounded border border-[#2E2E36] group hover:border-[#9945FF]/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {lesson.type === 'video' && <Video className="h-4 w-4 text-blue-400" />}
                                        {lesson.type === 'text' && <FileText className="h-4 w-4 text-gray-400" />}
                                        {lesson.type === 'challenge' && <Code className="h-4 w-4 text-[#14F195]" />}
                                        {lesson.type === 'quiz' && <HelpCircle className="h-4 w-4 text-yellow-400" />}
                                        <span className="text-gray-300">{lesson.title}</span>
                                        <span className="text-xs text-gray-600 bg-[#1E1E24] px-1.5 py-0.5 rounded">{lesson.xp} XP</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-gray-400 hover:text-white"
                                            onClick={() => setEditingLesson({ moduleId: module._id, lesson })}
                                            aria-label={`Edit ${lesson.title}`}
                                        >
                                            <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-gray-400 hover:text-red-400"
                                            onClick={async () => {
                                                if(confirm("Delete lesson?")) {
                                                    await deleteLesson(courseId, module._id, lesson._id);
                                                    router.refresh();
                                                }
                                            }}
                                            aria-label={`Delete ${lesson.title}`}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>

        {/* Lesson Editor Dialog */}
        <LessonEditor 
            open={!!editingLesson || !!isAddingLesson} 
            onOpenChange={(open: boolean) => {
                if (!open) {
                    setEditingLesson(null);
                    setIsAddingLesson(null);
                }
            }}
            courseId={courseId}
            moduleId={editingLesson?.moduleId || isAddingLesson || ''}
            lesson={editingLesson?.lesson}
        />
    </div>
  );
}
