"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { urlFor } from "@/sanity/lib/image";

type EditableLesson = {
  _id?: string;
  title: string;
  sortOrder: number;
  contentText: string;
};

type EditableModule = {
  _id?: string;
  title: string;
  sortOrder: number;
  lessons: EditableLesson[];
};

type Course = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  instructor?: string;
  duration?: string;
  difficulty?: string;
  track?: string;
  image?: any;
  published: boolean;
  modules?: Array<{
    _id: string;
    title: string;
    sortOrder: number;
    lessons?: Array<{
      _id: string;
      title: string;
      sortOrder: number;
      content?: any[];
    }>;
  }>;
};

export default function EditCoursePage() {
  const t = useTranslations("teach");
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [modulesState, setModulesState] = useState<EditableModule[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const walletAddress =
    wallets?.[0]?.address ??
    (typeof window !== "undefined" &&
      localStorage.getItem("linkedWalletAddress"));

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructor: "",
    duration: "",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    track: "other",
    published: false,
    image: null as any,
  });

  useEffect(() => {
    if (!authenticated || !walletAddress || !courseId) {
      setLoading(false);
      return;
    }

    fetch(`/api/courses/${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setCourse(data);
          const editableModules: EditableModule[] =
            data.modules?.map((mod: any, mi: number) => ({
              _id: mod._id,
              title: mod.title || "",
              sortOrder: typeof mod.sortOrder === "number" ? mod.sortOrder : mi,
              lessons:
                mod.lessons?.map((lesson: any, li: number) => {
                  const blocks = Array.isArray(lesson.content)
                    ? lesson.content
                    : [];
                  const contentText = blocks
                    .map((block: any) => {
                      if (!block || block._type !== "block") return "";
                      const children = Array.isArray(block.children)
                        ? block.children
                        : [];
                      return children
                        .map((child: any) => child?.text || "")
                        .join("");
                    })
                    .filter(Boolean)
                    .join("\n\n");

                  return {
                    _id: lesson._id,
                    title: lesson.title || "",
                    sortOrder:
                      typeof lesson.sortOrder === "number"
                        ? lesson.sortOrder
                        : li,
                    contentText,
                  } as EditableLesson;
                }) ?? [],
            })) ?? [];

          setModulesState(editableModules);
          setFormData({
            title: data.title || "",
            description: data.description || "",
            instructor: data.instructor || "",
            duration: data.duration || "",
            difficulty: (data.difficulty as any) || "beginner",
            track: data.track || "other",
            published: data.published || false,
            image: data.image || null,
          });

          if (data.image) {
            try {
              setImagePreview(urlFor(data.image).url());
            } catch (e) {
              console.error("Failed to generate image preview", e);
            }
          }
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load course");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authenticated, walletAddress, courseId]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !walletAddress) return;

    setUploading(true);
    setError(null);

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("wallet", walletAddress);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setFormData((prev) => ({
        ...prev,
        image: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: data.assetId,
          },
        },
      }));
      setImagePreview(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !courseId) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          wallet: walletAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update course");
      }

      // After updating course metadata, upsert modules and lessons (including content)
      if (modulesState.length > 0) {
        await fetch(`/api/courses/${courseId}/modules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: walletAddress,
            modules: modulesState.map((mod, mi) => ({
              _id: mod._id,
              title: mod.title,
              sortOrder: mi,
              lessons: mod.lessons.map((lesson, li) => ({
                _id: lesson._id,
                title: lesson.title,
                sortOrder: li,
                content: lesson.contentText,
              })),
            })),
          }),
        });
      }

      router.push("/teach/courses");
    } catch (err: any) {
      setError(err.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!walletAddress || !courseId) return;

    const endpoint = formData.published ? "unpublish" : "publish";
    const res = await fetch(`/api/courses/${courseId}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: walletAddress }),
    });

    if (res.ok) {
      setFormData({ ...formData, published: !formData.published });
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update publish status");
    }
  };

  if (!authenticated) {
    return (
      <div className="container py-8">
        <p>{t("login_required")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8">
        <p>{t("loading_course")}</p>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="container py-8">
        <div className="p-3 bg-red-500/10 border border-red-500 rounded text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("edit_course")}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course Logo Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">{t("course_logo")}</label>
          <div className="flex items-center gap-6">
            <div className="size-24 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-white/20 text-3xl">image</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? t("uploading") : t("upload_logo")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
              <p className="text-xs text-text-secondary">{t("logo_preview")}</p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            {t("title")}
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Introduction to Solana"
            className="flex h-10 w-full rounded-md border border-border-subtle bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-solana"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            {t("description")}
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            placeholder="Course description..."
            className="flex w-full rounded-md border border-border-subtle bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-solana"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="instructor" className="block text-sm font-medium mb-1">
              {t("instructor")}
            </label>
            <input
              id="instructor"
              type="text"
              value={formData.instructor}
              onChange={(e) =>
                setFormData({ ...formData, instructor: e.target.value })
              }
              placeholder="Your name"
              className="flex h-10 w-full rounded-md border border-border-subtle bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-solana"
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium mb-1">
              {t("duration")}
            </label>
            <input
              id="duration"
              type="text"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
              placeholder="2 hours, 4 weeks"
              className="flex h-10 w-full rounded-md border border-border-subtle bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-solana"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium mb-1">
              {t("difficulty")}
            </label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  difficulty: e.target.value as "beginner" | "intermediate" | "advanced",
                })
              }
              className="flex h-10 w-full rounded-md border border-border-subtle bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-solana"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label htmlFor="track" className="block text-sm font-medium mb-1">
              {t("track")}
            </label>
            <select
              id="track"
              value={formData.track}
              onChange={(e) => setFormData({ ...formData, track: e.target.value })}
              className="flex h-10 w-full rounded-md border border-border-subtle bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-solana"
            >
              <option value="solana">Solana</option>
              <option value="rust">Rust</option>
              <option value="anchor">Anchor</option>
              <option value="security">Security</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="border border-border-subtle rounded-md p-4">
          <h3 className="text-sm font-semibold mb-3">{t("modules_lessons")}</h3>
          <div className="space-y-4 text-sm">
            {modulesState.map((mod, modIndex) => (
              <div
                key={mod._id ?? `new-module-${modIndex}`}
                className="rounded-md border border-border-subtle p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">
                      {t("module_title")}
                    </label>
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) => {
                        const next = [...modulesState];
                        next[modIndex] = {
                          ...next[modIndex],
                          title: e.target.value,
                        };
                        setModulesState(next);
                      }}
                      placeholder={`Module ${modIndex + 1}`}
                      className="flex h-9 w-full rounded-md border border-border-subtle bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-solana"
                    />
                  </div>
                </div>

                <div className="mt-2 space-y-3">
                  {mod.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson._id ?? `new-lesson-${lessonIndex}`}
                      className="rounded-md bg-surface-high/40 p-3"
                    >
                      <div className="mb-2">
                        <label className="block text-xs font-medium mb-1">
                          {t("lesson_title", { index: lessonIndex + 1 })}
                        </label>
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => {
                            const next = [...modulesState];
                            next[modIndex].lessons[lessonIndex] = {
                              ...next[modIndex].lessons[lessonIndex],
                              title: e.target.value,
                            };
                            setModulesState(next);
                          }}
                          placeholder="Lesson title"
                          className="flex h-8 w-full rounded-md border border-border-subtle bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-solana"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          {t("lesson_content")}
                        </label>
                        <textarea
                          value={lesson.contentText}
                          onChange={(e) => {
                            const next = [...modulesState];
                            next[modIndex].lessons[lessonIndex] = {
                              ...next[modIndex].lessons[lessonIndex],
                              contentText: e.target.value,
                            };
                            setModulesState(next);
                          }}
                          rows={4}
                          placeholder="Write the lesson content here..."
                          className="flex w-full rounded-md border border-border-subtle bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-solana"
                        />
                        <p className="mt-1 text-[11px] text-text-secondary">
                          {t("lesson_content_info")}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const next = [...modulesState];
                      next[modIndex] = {
                        ...next[modIndex],
                        lessons: [
                          ...next[modIndex].lessons,
                          {
                            title: "",
                            sortOrder: next[modIndex].lessons.length,
                            contentText: "",
                          },
                        ],
                      };
                      setModulesState(next);
                    }}
                  >
                    {t("add_lesson")}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 text-xs"
            onClick={() => {
              setModulesState([
                ...modulesState,
                {
                  title: "",
                  sortOrder: modulesState.length,
                  lessons: [],
                },
              ]);
            }}
          >
            {t("add_module")}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) =>
                setFormData({ ...formData, published: e.target.checked })
              }
              className="h-4 w-4 rounded border-border-subtle"
            />
            <label htmlFor="published" className="text-sm font-medium">
              {t("published")}
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || uploading}>
            {saving ? t("saving") : t("save_changes")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePublish}
            disabled={saving || uploading}
          >
            {formData.published ? t("unpublish") : t("publish")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/teach/courses")}
            disabled={saving || uploading}
          >
            {t("cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
