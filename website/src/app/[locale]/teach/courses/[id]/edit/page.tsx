"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Button } from "@/components/ui/button";

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
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [modulesState, setModulesState] = useState<EditableModule[]>([]);

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
          });
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load course");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authenticated, walletAddress, courseId]);

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
          // Send modules/lessons structure for metadata only; content is handled by separate endpoint
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
        <p>Please log in to edit courses.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8">
        <p>Loading course...</p>
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

  // Sanity Studio deep-link for this course document
  const studioUrl = courseId
    ? `/studio/intent/edit/id=${encodeURIComponent(courseId)};type=course`
    : null;

  return (
    <div className="container py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Course</h1>
        {studioUrl && (
          <a
            href={studioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-solana/40 text-solana text-sm font-medium hover:bg-solana/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            Open in Sanity Studio ↗
          </a>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title *
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
            Description
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
              Instructor Name
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
              Duration
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
              Difficulty
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
              Track
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
          <h3 className="text-sm font-semibold mb-3">Modules & Lessons</h3>
          <div className="space-y-4 text-sm">
            {modulesState.map((mod, modIndex) => (
              <div
                key={mod._id ?? `new-module-${modIndex}`}
                className="rounded-md border border-border-subtle p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">
                      Module title
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
                          Lesson {lessonIndex + 1} title
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
                          Lesson content
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
                          Basic text only. Rich formatting and challenges will
                          be added in a later phase.
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
                    + Add lesson
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
            + Add module
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
              Published
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePublish}
          >
            {formData.published ? "Unpublish" : "Publish"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/teach/courses")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
