"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2, ArrowLeft, GripVertical, FileJson, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

interface DraftLesson {
  title: string;
  content: string;
  initialCode: string;
  isChallenge: boolean;
  validationRules: string;
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
  status?: string;
  modules: DraftModule[];
}

export default function CourseEditorPage() {
  const router = useRouter();
  const params = useParams();
  const slugParam = params.slug as string;
  const isNew = slugParam === "new";
  const t = useTranslations("AdminCourseEditor");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!isNew);

  const [course, setCourse] = useState<DraftCourse>({
    slug: "",
    title: "",
    description: "",
    difficulty: "Beginner",
    xpPerLesson: 50,
    imageUrl: "",
    isPublished: false,
    modules: [],
  });

  useEffect(() => {
    if (!isNew) {
      const loadCourse = async () => {
        try {
          const res = await fetch(`/api/courses/${slugParam}`);
          if (!res.ok) throw new Error(t("courseNotFound"));
          const data = await res.json();

          const formattedModules = data.modules.map((m: any) => ({
            title: m.title,
            lessons: m.lessons.map((l: any) => ({
              title: l.title,
              content: l.content,
              initialCode: l.initialCode || "",
              isChallenge: l.isChallenge,
              validationRules: l.validationRules ? JSON.stringify(l.validationRules) : "[]",
            })),
          }));

          setCourse({
            slug: data.slug || data.id,
            title: data.title,
            description: data.description,
            difficulty: data.difficulty,
            xpPerLesson: data.xpPerLesson,
            imageUrl: data.imageUrl || "",
            isPublished: data.status === "APPROVED",
            status: data.status,
            modules: formattedModules,
          });
        } catch (_error) {
          toast.error(t("failedLoad"));
          router.push("/admin/courses");
        } finally {
          setFetching(false);
        }
      };
      loadCourse();
    }
  }, [slugParam, isNew, router, t]);

  const isLockedOnChain = !isNew && course.status === "APPROVED";

  const addModule = () => {
    if (isLockedOnChain) return;
    setCourse({ ...course, modules: [...course.modules, { title: `${t("moduleLabel")} ${course.modules.length + 1}`, lessons: [] }] });
  };

  const removeModule = (modIndex: number) => {
    if (isLockedOnChain) return;
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
    if (isLockedOnChain) return;
    const newModules = [...course.modules];
    newModules[modIndex].lessons.push({
      title: `${t("lessonLabel")} ${newModules[modIndex].lessons.length + 1}`,
      content: "# Lesson Content\n\nExplain the concept here.",
      initialCode: "use anchor_lang::prelude::*;\n\n// Write your code here",
      isChallenge: true,
      validationRules: "[]",
    });
    setCourse({ ...course, modules: newModules });
  };

  const removeLesson = (modIndex: number, lessonIndex: number) => {
    if (isLockedOnChain) return;
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
    if (!course.slug || !course.title) {
      toast.error(t("slugTitleRequired"));
      return;
    }

    for (const mod of course.modules) {
      for (const les of mod.lessons) {
        if (les.isChallenge) {
          try {
            JSON.parse(les.validationRules);
          } catch (_e) {
            toast.error(t("invalidJson", { lesson: les.title }));
            return;
          }
        }
      }
    }

    setLoading(true);
    try {
      const payloadToSave = {
        ...course,
        status: course.isPublished ? "APPROVED" : course.status,
      };

      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSave),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("failedSave"));
      }

      toast.success(t("saved"));
      if (isNew) router.push("/admin/courses");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-32">
      <div className="sticky top-0 z-50 -mx-8 mb-8 flex items-center justify-between border-b border-border/60 bg-background/90 p-4 px-8 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/courses")}> <ArrowLeft className="h-5 w-5" /> </Button>
          <div>
            <h1 className="text-2xl font-bold">{isNew ? t("builderTitle") : t("editTitle")}</h1>
            <p className="text-xs text-muted-foreground">{course.title || t("untitled")}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-4 py-2">
            <Label htmlFor="publish-mode" className="cursor-pointer font-semibold">{t("publishOnChain")}</Label>
            <Switch id="publish-mode" checked={course.isPublished || isLockedOnChain} disabled={isLockedOnChain} onCheckedChange={(val) => setCourse({ ...course, isPublished: val })} />
          </div>
          <Button onClick={handleSave} disabled={loading} size="lg" className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("saveCourse")}
          </Button>
        </div>
      </div>

      {isLockedOnChain && (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            {t("publishedLockNotice")}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-4">
          <Card className="sticky top-28 border-border/60 bg-card/70 shadow-lg backdrop-blur-md">
            <CardHeader>
              <CardTitle>{t("metadata")}</CardTitle>
              <CardDescription>{t("metadataDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>{t("courseSlug")} <span className="text-destructive">*</span></Label>
                <Input placeholder={t("slugPlaceholder")} value={course.slug} onChange={(e) => setCourse({ ...course, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} disabled={isLockedOnChain} className={isLockedOnChain ? "cursor-not-allowed bg-muted opacity-60" : ""} />
                <p className="text-xs text-muted-foreground">{t("slugHint")} {isLockedOnChain ? t("lockedPublished") : ""}</p>
              </div>

              <div className="space-y-2">
                <Label>{t("title")} <span className="text-destructive">*</span></Label>
                <Input placeholder={t("courseTitlePlaceholder")} value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>{t("description")}</Label>
                <Textarea placeholder={t("descriptionPlaceholder")} className="h-24 resize-none" value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>{t("imageUrl")}</Label>
                <Input placeholder={t("imagePlaceholder")} value={course.imageUrl} onChange={(e) => setCourse({ ...course, imageUrl: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("difficulty")}</Label>
                  <Select value={course.difficulty} onValueChange={(val) => setCourse({ ...course, difficulty: val })} disabled={isLockedOnChain}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">{t("difficultyBeginner")}</SelectItem>
                      <SelectItem value="Intermediate">{t("difficultyIntermediate")}</SelectItem>
                      <SelectItem value="Advanced">{t("difficultyAdvanced")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("xpPerLesson")}</Label>
                  <Input type="number" value={course.xpPerLesson} onChange={(e) => setCourse({ ...course, xpPerLesson: parseInt(e.target.value) || 0 })} disabled={isLockedOnChain} className={isLockedOnChain ? "cursor-not-allowed bg-muted opacity-60" : ""} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t("curriculum")}</h2>
            {!isLockedOnChain && course.modules.length > 0 && (
              <Button onClick={addModule} className="gap-2">
                <Plus className="h-4 w-4" /> {t("addAnotherModule")}
              </Button>
            )}
          </div>

          {course.modules.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border/60 bg-card/50 p-12 text-center text-muted-foreground">
              <p className="mb-4">{t("noModules")}</p>
              {!isLockedOnChain && (
                <Button variant="outline" onClick={addModule}>
                  <Plus className="mr-2 h-4 w-4" /> {t("addFirstModule")}
                </Button>
              )}
            </div>
          )}

          <Accordion type="multiple" className="w-full space-y-6">
            {course.modules.map((module, mIndex) => (
              <AccordionItem key={mIndex} value={`mod-${mIndex}`} className="overflow-hidden rounded-xl border border-border/60 bg-card/70 shadow-sm">
                <div className="group flex items-center justify-between border-b bg-muted/20 p-2 pr-4">
                  <div className="flex flex-1 items-center gap-2">
                    <AccordionTrigger className="shrink-0 px-2 py-2 hover:no-underline">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </AccordionTrigger>
                    <Input className="h-9 border-transparent bg-transparent text-lg font-bold hover:border-border focus-visible:ring-1" value={module.title} onChange={(e) => updateModule(mIndex, e.target.value)} disabled={isLockedOnChain} />
                  </div>
                  {!isLockedOnChain && (
                    <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100" onClick={() => removeModule(mIndex)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <AccordionContent className="space-y-6 bg-background/50 p-6">
                  {module.lessons.map((lesson, lIndex) => (
                    <Card key={lIndex} className="relative overflow-hidden border-l-4 border-l-primary/40 border-border/60">
                      {!isLockedOnChain && (
                        <Button variant="destructive" size="icon" className="absolute right-2 top-2 z-10 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => removeLesson(mIndex, lIndex)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}

                      <CardContent className="space-y-5 p-5">
                        <div className="flex items-center gap-4 border-b pb-4">
                          <div className="rounded bg-primary/10 px-2 py-1 font-mono text-xs text-primary">L{lIndex + 1}</div>
                          <Input className="border-transparent bg-muted/20 text-base font-semibold hover:border-border" value={lesson.title} onChange={(e) => updateLesson(mIndex, lIndex, "title", e.target.value)} disabled={isLockedOnChain} />
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="flex justify-between text-muted-foreground">
                              {t("markdownContent")}
                              <span className="text-[10px]">{t("supportsCodeBlocks")}</span>
                            </Label>
                            <Textarea className="h-[300px] resize-y border-muted-foreground/20 bg-muted/10 font-mono text-sm" value={lesson.content} onChange={(e) => updateLesson(mIndex, lIndex, "content", e.target.value)} />
                          </div>

                          <div className="flex flex-col space-y-4">
                            <div className="rounded-lg border bg-muted/20 p-3">
                              <Label>{t("interactiveCoding")}</Label>
                              <p className="text-[10px] text-muted-foreground">{t("enableEditor")}</p>
                            </div>

                            {lesson.isChallenge && (
                              <>
                                <div className="flex flex-1 flex-col space-y-2">
                                  <Label className="text-muted-foreground">{t("initialCodeTemplate")}</Label>
                                  <Textarea className="min-h-[100px] flex-1 border-border/60 bg-muted/30 font-mono text-xs" value={lesson.initialCode} onChange={(e) => updateLesson(mIndex, lIndex, "initialCode", e.target.value)} />
                                </div>
                                <div className="flex flex-1 flex-col space-y-2 border-t pt-4">
                                  <Label className="flex items-center gap-2 text-muted-foreground"><FileJson className="h-4 w-4" /> {t("validationRules")}</Label>
                                  <Textarea className="min-h-[100px] flex-1 border-border/60 bg-muted/20 font-mono text-xs" value={lesson.validationRules} onChange={(e) => updateLesson(mIndex, lIndex, "validationRules", e.target.value)} placeholder='[{"type":"contains", "value":"msg!", "errorMessage":"Missing msg!"}]' />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {!isLockedOnChain && (
                    <Button variant="outline" className="w-full border-dashed py-8 text-muted-foreground hover:border-primary hover:text-primary" onClick={() => addLesson(mIndex)}>
                      <Plus className="mr-2 h-5 w-5" /> {t("addLessonTo", { module: module.title })}
                    </Button>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
