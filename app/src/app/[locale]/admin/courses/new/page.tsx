// app/src/app/[locale]/admin/courses/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2, ArrowLeft } from "lucide-react";

// Типы для конструктора
interface DraftLesson {
    title: string;
    content: string; // Markdown
    initialCode: string;
    isChallenge: boolean;
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
  
  // Состояние всего курса
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

  // Хелперы для управления модулями
  const addModule = () => {
      setCourse({
          ...course,
          modules: [...course.modules, { title: "New Module", lessons: [] }]
      });
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

  // Хелперы для управления уроками внутри модуля
  const addLesson = (modIndex: number) => {
      const newModules = [...course.modules];
      newModules[modIndex].lessons.push({
          title: "New Lesson",
          content: "# Lesson Content",
          initialCode: "// Write code here",
          isChallenge: true
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
      // Базовая валидация
      if (!course.slug || !course.title) {
          toast.error("Slug and Title are required");
          return;
      }
      // Slug должен быть lowercase и без пробелов (это ID для блокчейна)
      if (!/^[a-z0-9-]+$/.test(course.slug)) {
          toast.error("Slug must be lowercase alphanumeric with hyphens");
          return;
      }

      setLoading(true);
      try {
          // Отправляем в API, который мы создали в этапе 21 (api/admin/courses)
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
          
          // Если курс помечен как опубликованный (isPublished: true),
          // в идеале нам нужно запустить транзакцию в блокчейн (create_course).
          // Мы сделаем это на следующем этапе (Этап 30).
          // Пока просто редиректим к списку.
          
          router.push('/admin/courses');

      } catch (error: any) {
          toast.error(error.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/courses')}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Course Creator</h1>
        <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Label htmlFor="publish-mode">Publish immediately</Label>
                <Switch 
                    id="publish-mode" 
                    checked={course.isPublished} 
                    onCheckedChange={(val) => setCourse({...course, isPublished: val})} 
                />
            </div>
            <Button onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Course
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Basic Info (Left Column) */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader><CardTitle>Basic Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Course Slug (Blockchain ID)</Label>
                        <Input placeholder="e.g. solana-defi-101" value={course.slug} onChange={e => setCourse({...course, slug: e.target.value})} />
                        <p className="text-xs text-muted-foreground">Unique identifier used on-chain. Cannot be changed later easily.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input placeholder="Course Title" value={course.title} onChange={e => setCourse({...course, title: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Short description..." value={course.description} onChange={e => setCourse({...course, description: e.target.value})} />
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
                            <Label>XP per Lesson</Label>
                            <Input type="number" value={course.xpPerLesson} onChange={e => setCourse({...course, xpPerLesson: parseInt(e.target.value)})} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Curriculum Builder (Right Column) */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Curriculum Builder</CardTitle>
                    <Button variant="outline" size="sm" onClick={addModule}>
                        <Plus className="mr-2 h-4 w-4" /> Add Module
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {course.modules.length === 0 && (
                        <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                            No modules yet. Click "Add Module" to start.
                        </div>
                    )}

                    {course.modules.map((module, mIndex) => (
                        <div key={mIndex} className="p-4 border rounded-xl bg-muted/10 space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <Input 
                                    className="font-bold text-lg bg-transparent border-none focus-visible:ring-1" 
                                    value={module.title} 
                                    onChange={(e) => updateModule(mIndex, e.target.value)} 
                                />
                                <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeModule(mIndex)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Lessons within Module */}
                            <div className="pl-4 border-l-2 space-y-4">
                                {module.lessons.map((lesson, lIndex) => (
                                    <Card key={lIndex} className="p-4">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex-1 space-y-2">
                                                <Label>Lesson Title</Label>
                                                <Input value={lesson.title} onChange={e => updateLesson(mIndex, lIndex, 'title', e.target.value)} />
                                            </div>
                                            <Button variant="ghost" size="icon" className="mt-6 text-muted-foreground hover:text-destructive" onClick={() => removeLesson(mIndex, lIndex)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Markdown Content</Label>
                                                <Textarea 
                                                    className="font-mono text-sm h-32" 
                                                    value={lesson.content} 
                                                    onChange={e => updateLesson(mIndex, lIndex, 'content', e.target.value)} 
                                                    placeholder="# Lesson Content..."
                                                />
                                            </div>
                                            
                                            <div className="flex items-center gap-2 my-2">
                                                <Switch 
                                                    checked={lesson.isChallenge} 
                                                    onCheckedChange={(val) => updateLesson(mIndex, lIndex, 'isChallenge', val)} 
                                                />
                                                <Label>Is Coding Challenge? (Requires code validation)</Label>
                                            </div>

                                            {lesson.isChallenge && (
                                                <div className="space-y-2">
                                                    <Label>Initial Code Template</Label>
                                                    <Textarea 
                                                        className="font-mono text-sm h-32 bg-black text-green-400" 
                                                        value={lesson.initialCode} 
                                                        onChange={e => updateLesson(mIndex, lIndex, 'initialCode', e.target.value)} 
                                                        placeholder="// Starter code..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                                
                                <Button variant="secondary" size="sm" className="w-full border-dashed" onClick={() => addLesson(mIndex)}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Lesson
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}