"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MarkdownEditor } from "./markdown-editor";

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ThreadScopeDefaults {
  categoryId?: string;
  courseId?: string;
  lessonId?: string;
}

interface ThreadComposerProps {
  defaultScope?: ThreadScopeDefaults;
  /** Dismiss affordance — the modal closes, the inline composer collapses. */
  onCancel: () => void;
  /**
   * Called with the created thread. When supplied the composer does NOT
   * navigate: the caller stays put (the lesson pane refreshes its list in
   * place). Without it the composer routes to the new thread, which is what
   * the standalone modal wants.
   */
  onCreated?: (thread: { slug: string }) => void;
  className?: string;
}

/**
 * The shared create-a-thread form. Extracted from `create-thread-modal` so the
 * lesson Discussion section can compose inline (LeetCode's comment box) while
 * the community page keeps its modal — one submit path, one validation rule.
 *
 * Course/lesson scope rides straight through to the POST body, so a thread
 * started from a lesson carries the scope the feed's context chip reads back.
 */
export function ThreadComposer({
  defaultScope,
  onCancel,
  onCreated,
  className,
}: ThreadComposerProps) {
  const router = useRouter();
  const t = useTranslations("community");
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

      setTitle("");
      setBody("");
      setType("question");
      setCategoryId("");

      if (onCreated) {
        onCreated(thread);
        return;
      }

      onCancel();
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
    <div className={cn("space-y-4", className)}>
      {/* Type toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("question")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            type === "question"
              ? "bg-[var(--primary)] text-white"
              : "border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-2)]"
          )}
        >
          {t("question")}
        </button>
        <button
          type="button"
          onClick={() => setType("discussion")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            type === "discussion"
              ? "bg-[var(--primary)] text-white"
              : "border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-2)]"
          )}
        >
          {t("discussion")}
        </button>
      </div>

      {/* Category selector (hidden for course-scoped threads) */}
      {!isCourseScoped && (
        <div>
          <label
            htmlFor="thread-composer-category"
            className="mb-1 block text-sm font-medium text-[var(--text)]"
          >
            {t("category")}
          </label>
          <select
            id="thread-composer-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-[var(--border-default)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none"
          >
            <option value="">{t("selectCategory")}</option>
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
        <label
          htmlFor="thread-composer-title"
          className="mb-1 block text-sm font-medium text-[var(--text)]"
        >
          {t("titleLabel")}
        </label>
        {/* One frame, one interior colour — counter lives inside, matching
            the markdown editor's treatment. */}
        <div className="overflow-hidden rounded-md border border-[var(--border-default)] bg-[var(--input)] focus-within:border-[var(--primary)]">
          <input
            id="thread-composer-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("titlePlaceholder")}
            maxLength={200}
            className="w-full bg-transparent px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-2)] focus:outline-none"
          />
          <p className="px-3 pb-1.5 text-right text-xs text-[var(--text-2)]">
            {title.length}/200
          </p>
        </div>
      </div>

      {/* Body */}
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text)]">
          {t("detailsLabel")}
        </label>
        <MarkdownEditor
          value={body}
          onChange={setBody}
          placeholder={t("detailsPlaceholder")}
          minHeight="160px"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting && (
            // Ring drawn in the button's own foreground colour, matching every
            // other primary submit in the app. The old `.sol-spinner` painted a
            // dark track + XP-yellow head, which read as a foreign artefact on
            // the green button (and vanished entirely at disabled opacity).
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
          )}
          {t("post")}
        </Button>
      </div>
    </div>
  );
}
