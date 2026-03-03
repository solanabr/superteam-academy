"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { urlFor } from "@/sanity/lib/image";
import { Image as ImageIcon, Loader2 } from "lucide-react";

type EditableLesson = {
  _id?: string;
  title: string;
  sortOrder: number;
  contentText: string;
  testOutput?: string;
};

type EditableQuiz = {
  _id?: string;
  title: string;
  passingScore: number;
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }>;
};

type EditableModule = {
  _id?: string;
  title: string;
  sortOrder: number;
  lessons: EditableLesson[];
  quiz?: EditableQuiz | null;
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
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [modulesState, setModulesState] = useState<EditableModule[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const linkedAddress =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
  const walletAddress =
    linkedAddress ??
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

  const [titleStatus, setTitleStatus] = useState<'idle' | 'checking' | 'unique' | 'duplicate'>('idle');
  const [titleMessage, setTitleMessage] = useState("");

  const checkTitleUniqueness = async () => {
    if (!formData.title.trim()) return;
    setTitleStatus('checking');
    try {
      const res = await fetch(`/api/courses/check-title?title=${encodeURIComponent(formData.title.trim())}&id=${courseId}`);
      const data = await res.json();
      if (data.unique) {
        setTitleStatus('unique');
        setTitleMessage("Title is available!");
      } else {
        setTitleStatus('duplicate');
        setTitleMessage("A course with this name or slug already exists.");
      }
    } catch (e) {
      setTitleStatus('duplicate');
      setTitleMessage("Check failed.");
    }
  };

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
              quiz: mod.quiz ? {
                _id: mod.quiz._id,
                title: mod.quiz.title || "Module Quiz",
                passingScore: mod.quiz.passingScore || 70,
                questions: mod.quiz.questions?.map((q: any) => ({
                  question: q.question || "",
                  options: q.options || ["", ""],
                  correctIndex: q.correctIndex || 0,
                  explanation: q.explanation || "",
                })) || []
              } : null,
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
                    testOutput: lesson.challenge?.testCases?.[0]?.expected || "",
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

    // Only block if title has changed and hasn't been verified
    if (formData.title !== course?.title && titleStatus !== 'unique') {
      setError("Please verify the course title is unique first.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { published, ...updates } = formData;
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
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
                testOutput: lesson.testOutput,
              })),
              quiz: mod.quiz,
            })),
          }),
        });
      }

      // If the user changed the published state via the checkbox, trigger the proper endpoint
      if (course && formData.published !== course.published) {
        setPublishing(true);
        const endpoint = formData.published ? "publish" : "unpublish";
        await fetch(`/api/courses/${courseId}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress }),
        });
        setPublishing(false);
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

    setPublishing(true);
    const endpoint = formData.published ? "unpublish" : "publish";
    try {
      const res = await fetch(`/api/courses/${courseId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress }),
      });

      if (res.ok) {
        setFormData({ ...formData, published: !formData.published });
        if (!formData.published) {
          setSuccessMessage("Course structured on-chain! It will be published on your dashboard shortly.");
          setTimeout(() => setSuccessMessage(null), 4000);
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update publish status");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update publish status");
    } finally {
      setPublishing(false);
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
    <main className="min-h-screen bg-void pt-4 pb-12">
      <div className="mx-auto max-w-5xl px-4">
        <nav className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6 uppercase tracking-widest">
          <Link href="/teach/courses" className="hover:text-solana transition-colors">Studio</Link>
          <span className="text-white/20">/</span>
          <span className="text-solana">Edit</span>
        </nav>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t("edit_course")}</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-solana/10 border border-solana rounded-lg text-solana flex items-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium text-sm">{successMessage}</span>
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
                  <ImageIcon className="h-8 w-8 text-white/20" />
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
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (e.target.value !== course?.title) {
                  setTitleStatus('idle');
                  setTitleMessage("");
                } else {
                  setTitleStatus('idle');
                  setTitleMessage("");
                }
              }}
              required
              placeholder="Introduction to Solana"
              className="flex h-10 w-full rounded-md border border-border-subtle bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-solana"
            />
            <div className="mt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-rust hover:text-rust/80 hover:bg-rust/10"
                onClick={checkTitleUniqueness}
                disabled={titleStatus === 'checking' || !formData.title.trim()}
              >
                {titleStatus === 'checking' ? "Checking..." : "Check Availability"}
              </Button>
              {titleMessage && (
                <span className={`text-xs ${titleStatus === 'unique' ? 'text-green-500' : 'text-red-500'}`}>
                  {titleMessage}
                </span>
              )}
            </div>
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
                        <div className="mt-3">
                          <label className="block text-xs font-medium mb-1 flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-solana"></span>
                            Test Output (Challenge Validation)
                          </label>
                          <textarea
                            value={lesson.testOutput || ""}
                            onChange={(e) => {
                              const next = [...modulesState];
                              next[modIndex].lessons[lessonIndex] = {
                                ...next[modIndex].lessons[lessonIndex],
                                testOutput: e.target.value,
                              };
                              setModulesState(next);
                            }}
                            rows={2}
                            placeholder="Exact output expected from the user's code to pass the test..."
                            className="flex w-full rounded-md border border-border-subtle bg-[#050506] px-2 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-solana placeholder:text-text-muted"
                          />
                          <p className="mt-1 text-[10px] text-text-muted italic">
                            If provided, this lesson becomes a "Challenge" and users must match this output to pass.
                          </p>
                        </div>
                      </div>
                    ))}
                    {mod.quiz ? (
                      <div className="rounded-md bg-solana/5 border border-solana/20 p-3 mt-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-solana">Module Quiz</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => {
                              const next = [...modulesState];
                              next[modIndex].quiz = null;
                              setModulesState(next);
                            }}
                          >
                            Remove Quiz
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-[10px] font-medium mb-1">Quiz Title</label>
                            <input
                              type="text"
                              value={mod.quiz.title}
                              onChange={(e) => {
                                const next = [...modulesState];
                                if (next[modIndex].quiz) next[modIndex].quiz!.title = e.target.value;
                                setModulesState(next);
                              }}
                              className="flex h-7 w-full rounded-md border border-border-subtle bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-solana"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium mb-1">Passing Score (%)</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={mod.quiz.passingScore}
                              onChange={(e) => {
                                const next = [...modulesState];
                                if (next[modIndex].quiz) next[modIndex].quiz!.passingScore = parseInt(e.target.value) || 0;
                                setModulesState(next);
                              }}
                              className="flex h-7 w-full rounded-md border border-border-subtle bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-solana"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          {mod.quiz.questions.map((q, qIndex) => (
                            <div key={`q-${modIndex}-${qIndex}`} className="p-2 border border-white/5 rounded-md bg-black/40">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-medium text-text-muted">Question {qIndex + 1}</span>
                                <button type="button" onClick={() => {
                                  const next = [...modulesState];
                                  next[modIndex].quiz!.questions.splice(qIndex, 1);
                                  setModulesState(next);
                                }} className="text-[10px] text-red-500 hover:text-red-400">Remove</button>
                              </div>
                              <input
                                type="text"
                                placeholder="Question text..."
                                value={q.question}
                                onChange={(e) => {
                                  const next = [...modulesState];
                                  next[modIndex].quiz!.questions[qIndex].question = e.target.value;
                                  setModulesState(next);
                                }}
                                className="flex h-7 w-full rounded-md border border-border-subtle bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-solana mb-2"
                              />
                              <div className="space-y-1 pl-2 border-l border-white/10">
                                {q.options.map((opt, optIndex) => (
                                  <div key={`opt-${qIndex}-${optIndex}`} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct-${modIndex}-${qIndex}`}
                                      checked={q.correctIndex === optIndex}
                                      onChange={() => {
                                        const next = [...modulesState];
                                        next[modIndex].quiz!.questions[qIndex].correctIndex = optIndex;
                                        setModulesState(next);
                                      }}
                                    />
                                    <input
                                      type="text"
                                      placeholder={`Option ${optIndex + 1}`}
                                      value={opt}
                                      onChange={(e) => {
                                        const next = [...modulesState];
                                        next[modIndex].quiz!.questions[qIndex].options[optIndex] = e.target.value;
                                        setModulesState(next);
                                      }}
                                      className="flex h-6 w-full rounded-md border border-white/5 bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-solana"
                                    />
                                    {optIndex > 1 && (
                                      <button type="button" onClick={() => {
                                        const next = [...modulesState];
                                        next[modIndex].quiz!.questions[qIndex].options.splice(optIndex, 1);
                                        if (next[modIndex].quiz!.questions[qIndex].correctIndex >= next[modIndex].quiz!.questions[qIndex].options.length) {
                                          next[modIndex].quiz!.questions[qIndex].correctIndex = 0;
                                        }
                                        setModulesState(next);
                                      }} className="text-[10px] text-red-500 hover:text-red-400 aspect-square h-5 w-5 bg-red-500/10 rounded flex items-center justify-center">×</button>
                                    )}
                                  </div>
                                ))}
                                {q.options.length < 5 && (
                                  <button type="button" onClick={() => {
                                    const next = [...modulesState];
                                    next[modIndex].quiz!.questions[qIndex].options.push("");
                                    setModulesState(next);
                                  }} className="text-[10px] text-solana/70 hover:text-solana mt-1">+ Add Option</button>
                                )}
                              </div>
                              <input
                                type="text"
                                placeholder="Explanation (optional)..."
                                value={q.explanation || ""}
                                onChange={(e) => {
                                  const next = [...modulesState];
                                  next[modIndex].quiz!.questions[qIndex].explanation = e.target.value;
                                  setModulesState(next);
                                }}
                                className="flex h-7 w-full rounded-md border border-border-subtle bg-white/5 px-2 text-xs mt-2 focus:outline-none focus:ring-1 focus:ring-solana"
                              />
                            </div>
                          ))}
                          <button type="button" onClick={() => {
                            const next = [...modulesState];
                            next[modIndex].quiz!.questions.push({
                              question: "",
                              options: ["", ""],
                              correctIndex: 0,
                              explanation: ""
                            });
                            setModulesState(next);
                          }} className="text-xs text-solana hover:underline">+ Add Question</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 border-t border-white/10 pt-4" />
                    )}

                    <div className="flex items-center gap-3">
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
                      {!mod.quiz && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs border-solana/30 text-solana hover:bg-solana/10"
                          onClick={() => {
                            const next = [...modulesState];
                            next[modIndex].quiz = {
                              title: "Module Quiz",
                              passingScore: 70,
                              questions: [{
                                question: "New Question",
                                options: ["Option 1", "Option 2"],
                                correctIndex: 0,
                                explanation: ""
                              }]
                            };
                            setModulesState(next);
                          }}
                        >
                          + Add Quiz
                        </Button>
                      )}
                    </div>
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
            <Button type="submit" disabled={saving || publishing || uploading || (formData.title !== course?.title && titleStatus !== 'unique')}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save_changes")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePublish}
              disabled={saving || publishing || uploading}
            >
              {publishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {formData.published ? t("unpublish") : t("publish")}
                </>
              ) : (
                formData.published ? t("unpublish") : t("publish")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/teach/courses")}
              disabled={saving || publishing || uploading}
            >
              {t("cancel")}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
