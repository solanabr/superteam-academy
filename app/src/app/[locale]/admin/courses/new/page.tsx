// app/src/app/[locale]/admin/courses/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2, ArrowLeft, GripVertical, FileJson } from "lucide-react";

interface DraftLesson {
    title: string;
    content: string;
    initialCode: string;
    isChallenge: boolean;
    validationRules: string; // Храним как строку, чтобы юзер мог вставить JSON
}

interface DraftModule {
    title: string;
    lessons: DraftLesson[];
}

interface DraftCourse {
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    xpPerLesson: number;
    imageUrl: string;
    isPublished: boolean;
    modules: DraftModule[];
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [course, setCourse] = useState<DraftCourse>({
      slug: "",
      title: "",
      description: "",
      difficulty: "Beginner",
      xpPerLesson: 50,
      imageUrl: "",
      isPublished: false,
      modules: []
  });

  const addModule = () => {
      setCourse({ ...course, modules: [...course.modules, { title: `Module ${course.modules.length + 1}`, lessons: [] }] });
  };

  const removeModule = (modIndex: number) => {
      const newModules = [...course.modules];
      newModules.splice(modIndex, 1);
      setCourse({ ...course, modules: newModules });
  };

  const updateModule = (modIndex: number, title: string) => {
      const newModules = [...course.modules];
      newModules[modIndex].title = title;
      setCourse({ ...course, modules: newModules });
  };

  const addLesson = (modIndex: number) => {
      const newModules = [...course.modules];
      newModules[modIndex].lessons.push({
          title: `Lesson ${newModules[modIndex].lessons.length + 1}`,
          content: "# Lesson Content\n\nExplain the concept here.",
          initialCode: "use anchor_lang::prelude::*;\n\n// Write your code here",
          isChallenge: true,
          validationRules: "[]" // Пустой JSON массив по умолчанию
      });
      setCourse({ ...course, modules: newModules });
  };

  const removeLesson = (modIndex: number, lessonIndex: number) => {
      const newModules = [...course.modules];
      newModules[modIndex].lessons.splice(lessonIndex, 1);
      setCourse({ ...course, modules: newModules });
  };

  const updateLesson = (modIndex: number, lessonIndex: number, field: keyof DraftLesson, value: any) => {
      const newModules = [...course.modules];
      // @ts-ignore
      newModules[modIndex].lessons[lessonIndex][field] = value;
      setCourse({ ...course, modules: newModules });
  };

  const handleSave = async () => {
      if (!course.slug || !course.title) { toast.error("Slug and Title are required"); return; }
      
      // Валидация JSON правил перед отправкой
      for (const mod of course.modules) {
          for (const les of mod.lessons) {
              if (les.isChallenge) {
                  try {
                      JSON.parse(les.validationRules);
                  } catch (e) {
                      toast.error(`Invalid JSON in Validation Rules for lesson: ${les.title}`);
                      return;
                  }
              }
          }
      }

      setLoading(true);
      try {
          const res = await fetch('/api/admin/courses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(course)
          });

          if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || "Failed to save course");
          }

          toast.success("Course saved successfully!");
          router.push('/admin/courses');

      } catch (error: any) {
          toast.error(error.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-32">
      {/* Header Sticky Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b p-4 -mx-8 px-8 flex items-center justify-between mb-8 shadow-sm">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/courses')}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold">Course Builder</h1>
                <p className="text-xs text-muted-foreground">{course.title || "Untitled Course"}</p>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
                <Label htmlFor="publish-mode" className="font-semibold cursor-pointer">Publish On-Chain</Label>
                <Switch id="publish-mode" checked={course.isPublished} onCheckedChange={(val) => setCourse({...course, isPublished: val})} />
            </div>
            <Button onClick={handleSave} disabled={loading} size="lg" className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Course
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Basic Info (Left - 4 cols) */}
        <div className="xl:col-span-4 space-y-6">
            <Card className="sticky top-28 border-primary/20 shadow-lg">
                <CardHeader>
                    <CardTitle>Course Metadata</CardTitle>
                    <CardDescription>Core information displayed on the catalog.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label>Course Slug <span className="text-red-500">*</span></Label>
                        <Input placeholder="e.g. solana-defi-101" value={course.slug} onChange={e => setCourse({...course, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Title <span className="text-red-500">*</span></Label>
                        <Input placeholder="Course Title" value={course.title} onChange={e => setCourse({...course, title: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Short description..." className="h-24 resize-none" value={course.description} onChange={e => setCourse({...course, description: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input placeholder="https://arweave.net/..." value={course.imageUrl} onChange={e => setCourse({...course, imageUrl: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select value={course.difficulty} onValueChange={(val) => setCourse({...course, difficulty: val})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>XP / Lesson</Label>
                            <Input type="number" value={course.xpPerLesson} onChange={e => setCourse({...course, xpPerLesson: parseInt(e.target.value) || 0})} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Curriculum Builder (Right - 8 cols) */}
        <div className="xl:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Curriculum</h2>
            </div>

            {course.modules.length === 0 && (
                <div className="text-center p-12 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/10">
                    <p className="mb-4">No modules added yet. Start building your curriculum.</p>
                    <Button variant="outline" onClick={addModule}><Plus className="mr-2 h-4 w-4" /> Add First Module</Button>
                </div>
            )}

            <Accordion type="multiple" className="space-y-6 w-full">
                {course.modules.map((module, mIndex) => (
                    <AccordionItem key={mIndex} value={`mod-${mIndex}`} className="border rounded-xl bg-card overflow-hidden shadow-sm">
                        
                        <div className="flex items-center justify-between p-2 pr-4 bg-muted/30 border-b group">
                            <div className="flex-1 flex items-center gap-2">
                                <AccordionTrigger className="hover:no-underline py-2 px-2 shrink-0">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </AccordionTrigger>
                                <Input 
                                    className="font-bold text-lg bg-transparent border-transparent hover:border-border focus-visible:ring-1 h-9" 
                                    value={module.title} 
                                    onChange={(e) => updateModule(mIndex, e.target.value)} 
                                />
                            </div>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeModule(mIndex)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <AccordionContent className="p-6 bg-background/50 space-y-6">
                            {module.lessons.map((lesson, lIndex) => (
                                <Card key={lIndex} className="border-l-4 border-l-primary/50 shadow-sm relative group overflow-hidden">
                                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={() => removeLesson(mIndex, lIndex)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    
                                    <CardContent className="p-5 space-y-5">
                                        <div className="flex items-center gap-4 border-b pb-4">
                                            <div className="bg-primary/10 text-primary font-mono text-xs px-2 py-1 rounded">L{lIndex + 1}</div>
                                            <Input 
                                                className="font-semibold text-base border-transparent hover:border-border bg-muted/20" 
                                                value={lesson.title} 
                                                onChange={e => updateLesson(mIndex, lIndex, 'title', e.target.value)} 
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground flex justify-between">
                                                    Markdown Content
                                                    <span className="text-[10px]">Supports Code Blocks</span>
                                                </Label>
                                                <Textarea 
                                                    className="font-mono text-sm h-[300px] resize-y bg-muted/10 border-muted-foreground/20" 
                                                    value={lesson.content} 
                                                    onChange={e => updateLesson(mIndex, lIndex, 'content', e.target.value)} 
                                                />
                                            </div>
                                            
                                            <div className="space-y-4 flex flex-col">
                                                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                                    <div className="space-y-0.5">
                                                        <Label>Interactive Coding</Label>
                                                        <p className="text-[10px] text-muted-foreground">Enable code editor for this lesson</p>
                                                    </div>
                                                    <Switch checked={lesson.isChallenge} onCheckedChange={(val) => updateLesson(mIndex, lIndex, 'isChallenge', val)} />
                                                </div>

                                                {lesson.isChallenge && (
                                                    <>
                                                        <div className="space-y-2 flex-1 flex flex-col">
                                                            <Label className="text-muted-foreground">Initial Code Template</Label>
                                                            <Textarea 
                                                                className="font-mono text-xs flex-1 min-h-[100px] bg-[#1e1e1e] text-green-400 border-none" 
                                                                value={lesson.initialCode} 
                                                                onChange={e => updateLesson(mIndex, lIndex, 'initialCode', e.target.value)} 
                                                            />
                                                        </div>
                                                        <div className="space-y-2 flex-1 flex flex-col border-t pt-4">
                                                            <Label className="text-muted-foreground flex items-center gap-2">
                                                                <FileJson className="h-4 w-4" /> Validation Rules (JSON Array)
                                                            </Label>
                                                            <Textarea 
                                                                className="font-mono text-xs flex-1 min-h-[100px] bg-muted/20 border-yellow-500/30" 
                                                                value={lesson.validationRules} 
                                                                onChange={e => updateLesson(mIndex, lIndex, 'validationRules', e.target.value)} 
                                                                placeholder='[{"type":"contains", "value":"msg!", "errorMessage":"Missing msg!"}]'
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            
                            <Button variant="outline" className="w-full border-dashed py-8 text-muted-foreground hover:text-primary hover:border-primary" onClick={() => addLesson(mIndex)}>
                                <Plus className="mr-2 h-5 w-5" /> Add New Lesson to {module.title}
                            </Button>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            
            {course.modules.length > 0 && (
                <Button variant="default" size="lg" className="w-full mt-4" onClick={addModule}>
                    <Plus className="mr-2 h-5 w-5" /> Add Another Module
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}