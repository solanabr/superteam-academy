"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleField } from "./locale-field";
import { LocaleTextarea } from "./locale-textarea";
import { ImageUpload } from "./image-upload";
import { ModuleEditor } from "./module-editor";
import { Plus, Save } from "lucide-react";
import type { CourseForm as CourseFormType, ModuleForm } from "@/types/admin";

interface CourseFormProps {
  editId?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createEmptyForm(): CourseFormType {
  return {
    courseId: crypto.randomUUID().slice(0, 8),
    slug: "",
    title: { pt: "", en: "", es: "" },
    description: { pt: "", en: "", es: "" },
    longDescription: { pt: "", en: "", es: "" },
    difficulty: "beginner",
    duration: "short",
    totalDurationMinutes: 60,
    xpTotal: 500,
    thumbnailAssetId: null,
    thumbnailUrl: null,
    instructorRef: null,
    track: "",
    modules: [],
    published: false,
  };
}

function createEmptyModule(): ModuleForm {
  return {
    moduleId: crypto.randomUUID().slice(0, 8),
    title: { pt: "", en: "", es: "" },
    lessons: [],
  };
}

interface InstructorOption {
  _id: string;
  name: string;
}

export function CourseFormComponent({ editId }: CourseFormProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const { walletAddress } = useAdmin();
  const { toast } = useToast();
  const [form, setForm] = useState<CourseFormType>(createEmptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);

  const headers = {
    "X-Wallet-Address": walletAddress ?? "",
    "Content-Type": "application/json",
  };

  // Fetch instructors for the select
  useEffect(() => {
    if (!walletAddress) return;
    fetch("/api/admin/courses", {
      headers: { "X-Wallet-Address": walletAddress },
    }).catch(() => {});

    // Fetch instructors from Sanity via a simple approach
    // We use the courses API but we'll add a separate query
    // For now, let instructors be optional — admin can set ref manually
  }, [walletAddress]);

  // Load course data if editing
  useEffect(() => {
    if (!editId || !walletAddress) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/courses/${editId}`, {
          headers: { "X-Wallet-Address": walletAddress },
        });
        if (!res.ok) throw new Error("Failed to fetch course");
        const data = await res.json();
        setForm({
          courseId: data.courseId ?? "",
          slug: data.slug ?? "",
          title: data.title ?? { pt: "", en: "", es: "" },
          description: data.description ?? { pt: "", en: "", es: "" },
          longDescription: data.longDescription ?? { pt: "", en: "", es: "" },
          difficulty: data.difficulty ?? "beginner",
          duration: data.duration ?? "short",
          totalDurationMinutes: data.totalDurationMinutes ?? 60,
          xpTotal: data.xpTotal ?? 500,
          thumbnailAssetId: data.thumbnailAssetId ?? null,
          thumbnailUrl: data.thumbnailUrl ?? null,
          instructorRef: data.instructorRef ?? null,
          track: data.track ?? "",
          modules: (data.modules ?? []).map((m: Record<string, unknown>) => ({
            moduleId: m.moduleId ?? "",
            title: m.title ?? { pt: "", en: "", es: "" },
            lessons: ((m.lessons as Record<string, unknown>[]) ?? []).map(
              (l: Record<string, unknown>) => ({
                lessonId: l.lessonId ?? "",
                title: l.title ?? { pt: "", en: "", es: "" },
                slug: l.slug ?? "",
                lessonType: l.lessonType ?? "content",
                durationMinutes: l.durationMinutes ?? 10,
                xpReward: l.xpReward ?? 50,
                content: l.content,
                exercise: l.exercise,
                challenge: l.challenge,
              }),
            ),
          })),
          published: data.published ?? false,
        });
      } catch (err) {
        console.error("[CourseForm]", err);
        toast({ title: t("saveError"), variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [editId, walletAddress, t, toast]);

  // Auto-generate slug from PT title
  useEffect(() => {
    if (!editId && form.title.pt) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.title.pt) }));
    }
  }, [form.title.pt, editId]);

  const update = (patch: Partial<CourseFormType>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return;

    setSaving(true);
    try {
      const url = editId
        ? `/api/admin/courses/${editId}`
        : "/api/admin/courses";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Save failed");

      toast({ title: t("saveSuccess") });
      router.push("/admin");
    } catch (err) {
      console.error("[CourseForm]", err);
      toast({ title: t("saveError"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--brand-logo-green))] border-t-transparent" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Metadata */}
      <Card className="border-[hsl(var(--brand-logo-green))]/30">
        <CardHeader className="text-center">
          <CardTitle>{editId ? t("editCourse") : t("createCourse")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("courseId")}</label>
              <Input
                value={form.courseId}
                onChange={(e) => update({ courseId: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("slug")}</label>
              <Input
                value={form.slug}
                onChange={(e) => update({ slug: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t("autoSlug")}</p>
            </div>
          </div>

          <LocaleField
            value={form.title}
            onChange={(title) => update({ title })}
            label={t("titleField")}
            required
          />

          <LocaleTextarea
            value={form.description}
            onChange={(description) => update({ description })}
            label={t("description")}
          />

          <LocaleTextarea
            value={form.longDescription}
            onChange={(longDescription) => update({ longDescription })}
            label={t("longDescription")}
            rows={5}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("difficulty")}</label>
              <select
                value={form.difficulty}
                onChange={(e) =>
                  update({
                    difficulty: e.target.value as
                      | "beginner"
                      | "intermediate"
                      | "advanced",
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="beginner">{t("beginner")}</option>
                <option value="intermediate">{t("intermediate")}</option>
                <option value="advanced">{t("advanced")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("duration")}</label>
              <select
                value={form.duration}
                onChange={(e) =>
                  update({
                    duration: e.target.value as "short" | "medium" | "long",
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="short">{t("short")}</option>
                <option value="medium">{t("medium")}</option>
                <option value="long">{t("long")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("track")}</label>
              <Input
                value={form.track}
                onChange={(e) => update({ track: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("totalDuration")}
              </label>
              <Input
                type="number"
                value={form.totalDurationMinutes}
                onChange={(e) =>
                  update({ totalDurationMinutes: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("xpTotal")}</label>
              <Input
                type="number"
                value={form.xpTotal}
                onChange={(e) => update({ xpTotal: Number(e.target.value) })}
              />
            </div>
          </div>

          <ImageUpload
            currentUrl={form.thumbnailUrl}
            onUpload={({ assetId, url }) =>
              update({ thumbnailAssetId: assetId, thumbnailUrl: url })
            }
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="published"
              checked={form.published}
              onChange={(e) => update({ published: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="published" className="text-sm font-medium">
              {t("published")}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card className="border-[hsl(var(--brand-logo-green))]/30">
        <CardHeader className="text-center">
          <CardTitle>{t("modules")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.modules.map((mod, mi) => (
            <ModuleEditor
              key={mod.moduleId}
              module={mod}
              onChange={(updated) => {
                const modules = [...form.modules];
                modules[mi] = updated;
                update({ modules });
              }}
              onRemove={() =>
                update({ modules: form.modules.filter((_, i) => i !== mi) })
              }
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              update({ modules: [...form.modules, createEmptyModule()] })
            }
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("addModule")}
          </Button>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin")}
        >
          {t("backToAdmin")}
        </Button>
        <Button type="submit" disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
