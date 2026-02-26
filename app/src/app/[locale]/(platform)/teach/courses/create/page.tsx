"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function CreateCoursePage() {
  const router = useRouter();
  const t = useTranslations("teach");
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            moduleTitle || lessonTitles.length
              ? [
                {
                  title: moduleTitle || "Module 1",
                  lessons: lessonTitles.map((title) => ({ title })),
                },
              ]
              : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create course");
      }

      // Delay slightly to give Sanity time to globally index the new document,
      // ensuring it appears in the list when we land on the next page.
      setTimeout(() => {
        router.refresh();
        router.push(`/teach/courses`);
      }, 1500);
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
              {loading ? "Creating..." : "Create Course"}
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
