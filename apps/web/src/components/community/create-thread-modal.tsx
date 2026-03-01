"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MarkdownEditor } from "./markdown-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
}

interface CreateThreadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultScope?: {
    categoryId?: string;
    courseId?: string;
    lessonId?: string;
  };
}

export function CreateThreadModal({
  open,
  onOpenChange,
  defaultScope,
}: CreateThreadModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"question" | "discussion">("question");
  const [categoryId, setCategoryId] = useState(defaultScope?.categoryId || "");
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCourseScoped = !!defaultScope?.courseId;

  useEffect(() => {
    if (isCourseScoped) return;

    async function loadCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from("forum_categories")
        .select("id, name, slug")
        .order("sort_order");
      if (data) setCategories(data);
    }

    loadCategories();
  }, [isCourseScoped]);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/community/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          type,
          categoryId: isCourseScoped ? undefined : categoryId || undefined,
          courseId: defaultScope?.courseId || undefined,
          lessonId: defaultScope?.lessonId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create thread");
      }

      const thread = await res.json();

      // Reset form
      setTitle("");
      setBody("");
      setType("question");
      setCategoryId("");
      onOpenChange(false);

      // Resolve category slug for redirect
      const catSlug =
        categories.find((c) => c.id === categoryId)?.slug || "general";
      router.push(
        `/community/${isCourseScoped ? "general" : catSlug}/${thread.slug}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create thread");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    title.length >= 5 &&
    title.length <= 200 &&
    body.length >= 10 &&
    body.length <= 10000 &&
    (isCourseScoped || !!categoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === "question" ? "Ask a Question" : "Start a Discussion"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("question")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                type === "question"
                  ? "bg-[var(--primary)] text-white"
                  : "border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-2)]"
              }`}
            >
              Question
            </button>
            <button
              type="button"
              onClick={() => setType("discussion")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                type === "discussion"
                  ? "bg-[var(--primary)] text-white"
                  : "border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-2)]"
              }`}
            >
              Discussion
            </button>
          </div>

          {/* Category selector (hidden for course-scoped threads) */}
          {!isCourseScoped && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-[var(--border-default)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question or topic?"
              maxLength={200}
              className="w-full rounded-md border border-[var(--border-default)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-2)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-[var(--text-2)]">
              {title.length}/200
            </p>
          </div>

          {/* Body */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">
              Details
            </label>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder="Describe your question or topic in detail. Use Markdown for formatting."
              minHeight="200px"
            />
          </div>

          {/* Error */}
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
