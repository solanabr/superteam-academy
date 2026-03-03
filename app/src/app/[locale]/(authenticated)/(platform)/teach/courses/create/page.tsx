"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export default function CreateCoursePage() {
  const router = useRouter();
  const t = useTranslations("teach");
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructor: "",
    duration: "",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    track: "other",
    published: false,
  });

  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonTitles, setLessonTitles] = useState<string[]>([]);

  const [quizData, setQuizData] = useState({
    enabled: false,
    passingScore: 70,
    questionCount: 1,
  });

  const linkedAddress =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
  const walletAddress =
    linkedAddress ??
    wallets?.[0]?.address ??
    (typeof window !== "undefined" &&
      localStorage.getItem("linkedWalletAddress"));

  const [titleStatus, setTitleStatus] = useState<'idle' | 'checking' | 'unique' | 'duplicate'>('idle');
  const [titleMessage, setTitleMessage] = useState("");

  const checkTitleUniqueness = async () => {
    if (!formData.title.trim()) return;
    setTitleStatus('checking');
    try {
      const res = await fetch(`/api/courses/check-title?title=${encodeURIComponent(formData.title.trim())}`);
      const data = await res.json();
      if (data.unique) {
        setTitleStatus('unique');
        setTitleMessage("Title is available!");
      } else {
        setTitleStatus('duplicate');
        setTitleMessage("A course with this name already exists.");
      }
    } catch (e) {
      setTitleStatus('duplicate');
      setTitleMessage("Check failed.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated || !walletAddress) {
      setError("Please connect your wallet");
      return;
    }

    if (titleStatus !== 'unique') {
      setError("Please verify the course title is unique first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          wallet: walletAddress,
          published: formData.published,
          modules:
            moduleTitle || lessonTitles.length || quizData.enabled
              ? [
                {
                  title: moduleTitle || "Module 1",
                  lessons: lessonTitles.map((title) => ({ title })),
                  quiz: quizData.enabled ? {
                    passingScore: quizData.passingScore,
                    questions: Array(quizData.questionCount).fill(null).map((_, i) => ({
                      question: `Question ${i + 1}`,
                      options: ["Option 1", "Option 2"],
                      correctIndex: 0,
                      explanation: ""
                    }))
                  } : undefined,
                },
              ]
              : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create course");
      }

      if (formData.published) {
        setSuccessMessage("Course structured on-chain! It will be published on your dashboard shortly.");
        setTimeout(() => {
          router.refresh();
          router.push(`/teach/courses`);
        }, 4000);
      } else {
        setTimeout(() => {
          router.refresh();
          router.push(`/teach/courses`);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create course");
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="container py-8">
        <p>{t("login_create_course")}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-void pt-4 pb-12">
      <div className="mx-auto max-w-2xl px-4">
        <nav className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6 uppercase tracking-widest">
          <Link href="/teach/courses" className="hover:text-solana transition-colors">{t("studio")}</Link>
          <span className="text-white/20">/</span>
          <span className="text-solana">{t("new_course")}</span>
        </nav>
        <h1 className="text-2xl font-bold mb-6">Create New Course</h1>

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
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setTitleStatus('idle');
                setTitleMessage("");
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

          <div className="space-y-4 border border-border-subtle rounded-md p-4">
            <h2 className="text-sm font-semibold">Module & Lessons (optional)</h2>

            <div>
              <label htmlFor="moduleTitle" className="block text-sm font-medium mb-1">
                Module title
              </label>
              <input
                id="moduleTitle"
                type="text"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder="Getting started with Solana"
                className="flex h-10 w-full rounded-md border border-border-subtle bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-solana"
              />
            </div>

            <div>
              <label htmlFor="lessonTitle" className="block text-sm font-medium mb-1">
                Lesson titles
              </label>
              <div className="flex gap-2">
                <input
                  id="lessonTitle"
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Intro lesson title"
                  className="flex h-10 w-full rounded-md border border-border-subtle bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-solana"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const t = lessonTitle.trim();
                    if (!t) return;
                    setLessonTitles((prev) => [...prev, t]);
                    setLessonTitle("");
                  }}
                >
                  Add
                </Button>
              </div>
              {lessonTitles.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {lessonTitles.map((t, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span>
                        {idx + 1}. {t}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setLessonTitles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-xs text-red-400 hover:text-red-300 h-auto p-1"
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4 mt-2 border-t border-white/5 pt-4">
                <input
                  type="checkbox"
                  id="includeQuiz"
                  checked={quizData.enabled}
                  onChange={(e) =>
                    setQuizData({ ...quizData, enabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border-subtle"
                />
                <label htmlFor="includeQuiz" className="text-sm font-medium text-solana">
                  Include a Module Quiz
                </label>
              </div>

              {quizData.enabled && (
                <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-solana/20">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-text-muted">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={quizData.passingScore}
                      onChange={(e) =>
                        setQuizData({ ...quizData, passingScore: parseInt(e.target.value) || 0 })
                      }
                      className="flex h-9 w-full rounded-md border border-border-subtle bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-solana"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-text-muted">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={quizData.questionCount}
                      onChange={(e) =>
                        setQuizData({ ...quizData, questionCount: parseInt(e.target.value) || 1 })
                      }
                      className="flex h-9 w-full rounded-md border border-border-subtle bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-solana"
                    />
                  </div>
                  <p className="text-[10px] text-text-muted col-span-2 italic">
                    Note: This will scaffold a quiz with the specified number of questions. You can fill in the actual question text and options later on the Edit Course page.
                  </p>
                </div>
              )}
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


          <div className="flex gap-3">
            <Button type="submit" disabled={loading || titleStatus !== 'unique'} variant="solana-ghost">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Course"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10 text-sm">
          <p className="font-semibold mb-2 text-solana">Note:</p>
          <p className="text-text-secondary leading-relaxed">
            Add your course title and structure here to get started. Publishing is available after you review the draft course and finish adding/editing lesson content, challenges, and test outputs in the Sanity Studio editor.
          </p>
        </div>
      </div>
    </main>
  );
}
