"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "help", label: "Help" },
  { value: "showcase", label: "Showcase" },
  { value: "feedback", label: "Feedback" },
];

interface NewThreadFormProps {
  wallet: string;
}

export function NewThreadForm({ wallet }: NewThreadFormProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "en";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [courseId, setCourseId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/community/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: body.trim(),
          category,
          courseId: courseId.trim() || undefined,
          wallet,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create thread");
      }

      const data = await res.json();
      router.push(`/${locale}/community/${data.thread.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create thread");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/${locale}/community`}
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--c-text-2)] transition-colors hover:text-[var(--c-text)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Community
      </Link>

      <h1 className="mb-6 text-xl font-semibold text-[var(--c-text)]">
        New Thread
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="thread-title"
            className="mb-2 block text-sm font-medium text-[var(--c-text-em)]"
          >
            Title
          </label>
          <Input
            id="thread-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your question or topic?"
            maxLength={200}
          />
        </div>

        <div>
          <label
            htmlFor="thread-body"
            className="mb-2 block text-sm font-medium text-[var(--c-text-em)]"
          >
            Content
          </label>
          <textarea
            id="thread-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts... (Markdown supported)"
            className="flex min-h-[200px] w-full rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] px-3 py-2 text-sm text-[var(--c-text)] placeholder:text-[var(--c-text-2)] transition-colors focus:border-[#55E9AB] focus:outline-none focus:ring-1 focus:ring-[#55E9AB] resize-y"
          />
          <p className="mt-1 text-[10px] font-mono text-[var(--c-text-muted)] uppercase tracking-wider">
            Markdown supported
          </p>
        </div>

        <div>
          <label
            htmlFor="thread-category"
            className="mb-2 block text-sm font-medium text-[var(--c-text-em)]"
          >
            Category
          </label>
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`rounded-[2px] border px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all duration-150 ${
                  category === cat.value
                    ? "border-[#55E9AB] bg-[#55E9AB]/10 text-[#55E9AB]"
                    : "border-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:border-[var(--c-border-prominent)] hover:text-[var(--c-text)]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="thread-course"
            className="mb-2 block text-sm font-medium text-[var(--c-text-em)]"
          >
            Related Course ID{" "}
            <span className="text-[var(--c-text-muted)] font-normal">(optional)</span>
          </label>
          <Input
            id="thread-course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="e.g. intro-to-solana"
          />
        </div>

        {error && (
          <div className="rounded-[2px] border border-[#EF4444]/20 bg-[#EF4444]/5 px-4 py-3 text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={!title.trim() || !body.trim() || submitting} className="gap-1.5">
            <Send className="h-4 w-4" />
            {submitting ? "Creating..." : "Create Thread"}
          </Button>
        </div>
      </form>
    </div>
  );
}
