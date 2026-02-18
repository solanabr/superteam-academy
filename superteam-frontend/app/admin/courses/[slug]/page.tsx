"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Course, Module, Lesson } from "@/lib/course-catalog";
import { toast } from "sonner";

type PageProps = { params: Promise<{ slug: string }> };

export default function CourseEditorPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/courses/${slug}`)
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          throw new Error(`HTTP ${r.status}${text ? `: ${text}` : ""}`);
        }
        return r.json();
      })
      .then((d: Course) => setCourse(d))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to load course";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSave() {
    if (!course) return;
    setSaving(true);
    const totalLessons = course.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0,
    );
    const updated = { ...course, lessons: totalLessons };
    const res = await fetch(`/api/admin/courses/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (data.onChain) {
      toast.success("Course saved and synced on-chain");
    } else {
      toast.success("Course saved locally");
      if (data.chainError)
        toast.warning(`On-chain sync failed: ${data.chainError}`);
    }
  }

  function updateField<K extends keyof Course>(key: K, value: Course[K]) {
    setCourse((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function addModule() {
    setCourse((prev) => {
      if (!prev) return prev;
      const modules = [
        ...prev.modules,
        { title: `Module ${prev.modules.length + 1}`, lessons: [] },
      ];
      return { ...prev, modules };
    });
  }

  function updateModule(idx: number, updates: Partial<Module>) {
    setCourse((prev) => {
      if (!prev) return prev;
      const modules = prev.modules.map((m, i) =>
        i === idx ? { ...m, ...updates } : m,
      );
      return { ...prev, modules };
    });
  }

  function removeModule(idx: number) {
    setCourse((prev) => {
      if (!prev) return prev;
      return { ...prev, modules: prev.modules.filter((_, i) => i !== idx) };
    });
  }

  function addLesson(moduleIdx: number) {
    setCourse((prev) => {
      if (!prev) return prev;
      const modules = prev.modules.map((m, i) => {
        if (i !== moduleIdx) return m;
        const id = `${moduleIdx + 1}-${m.lessons.length + 1}`;
        const lessons: Lesson[] = [
          ...m.lessons,
          {
            id,
            title: `New Lesson`,
            type: "reading",
            duration: "10m",
            completed: false,
          },
        ];
        return { ...m, lessons };
      });
      return { ...prev, modules };
    });
  }

  function updateLesson(
    moduleIdx: number,
    lessonIdx: number,
    updates: Partial<Lesson>,
  ) {
    setCourse((prev) => {
      if (!prev) return prev;
      const modules = prev.modules.map((m, mi) => {
        if (mi !== moduleIdx) return m;
        const lessons = m.lessons.map((l, li) =>
          li === lessonIdx ? { ...l, ...updates } : l,
        );
        return { ...m, lessons };
      });
      return { ...prev, modules };
    });
  }

  function removeLesson(moduleIdx: number, lessonIdx: number) {
    setCourse((prev) => {
      if (!prev) return prev;
      const modules = prev.modules.map((m, mi) => {
        if (mi !== moduleIdx) return m;
        return { ...m, lessons: m.lessons.filter((_, li) => li !== lessonIdx) };
      });
      return { ...prev, modules };
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="space-y-4 p-12 text-center">
        <p className="text-sm text-destructive">
          {error || "Course not found"}
        </p>
        <Button variant="outline" onClick={() => router.push("/admin/courses")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/courses")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-sm text-muted-foreground">{course.slug}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={course.title}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Instructor</Label>
              <Input
                value={course.instructor}
                onChange={(e) => updateField("instructor", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={course.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={course.difficulty}
                onValueChange={(v) =>
                  updateField("difficulty", v as Course["difficulty"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input
                value={course.duration}
                onChange={(e) => updateField("duration", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>XP</Label>
              <Input
                type="number"
                value={course.xp}
                onChange={(e) => updateField("xp", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={course.tags.join(", ")}
                onChange={(e) =>
                  updateField(
                    "tags",
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules & Lessons */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Modules & Lessons
              <Badge variant="secondary" className="ml-2">
                {course.modules.length} modules,{" "}
                {course.modules.reduce((s, m) => s + m.lessons.length, 0)}{" "}
                lessons
              </Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addModule}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Module
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {course.modules.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No modules yet. Click &quot;Add Module&quot; to get started.
            </p>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {course.modules.map((mod, mi) => (
                <AccordionItem
                  key={mi}
                  value={`module-${mi}`}
                  className="rounded-lg border px-4"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{mod.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {mod.lessons.length} lessons
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-4">
                    {/* Module title */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={mod.title}
                        onChange={(e) =>
                          updateModule(mi, { title: e.target.value })
                        }
                        className="flex-1"
                        placeholder="Module title"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive"
                        onClick={() => removeModule(mi)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Lessons */}
                    <div className="space-y-2 pl-4">
                      {mod.lessons.map((lesson, li) => (
                        <div
                          key={li}
                          className="flex items-center gap-2 rounded-md border bg-muted/30 p-2"
                        >
                          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <Input
                            value={lesson.title}
                            onChange={(e) =>
                              updateLesson(mi, li, { title: e.target.value })
                            }
                            className="flex-1 h-8 text-sm"
                          />
                          <Select
                            value={lesson.type}
                            onValueChange={(v) =>
                              updateLesson(mi, li, {
                                type: v as Lesson["type"],
                              })
                            }
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="reading">Reading</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="challenge">
                                Challenge
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={lesson.duration}
                            onChange={(e) =>
                              updateLesson(mi, li, {
                                duration: e.target.value,
                              })
                            }
                            className="w-20 h-8 text-xs"
                            placeholder="10m"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-destructive"
                            onClick={() => removeLesson(mi, li)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => addLesson(mi)}
                      >
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Add Lesson
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
