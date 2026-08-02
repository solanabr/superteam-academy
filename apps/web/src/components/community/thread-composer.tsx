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
  /**
   * Dense rendering for narrow embeds (the lesson pane): smaller toggle
   * segments and sm footer buttons, so the form doesn't dwarf its host.
   */
  compact?: boolean;
}

/**
 * The shared create-a-thread form. Originally extracted from the (since
 * deleted) create-thread-modal so the
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
  compact = false,
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
        // The route's `error` is an English server string, so it is not shown:
        // the learner gets one localized failure line and the detail stays in
        // the network tab where it is actually useful.
        throw new Error("create-thread-failed");
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
    } catch {
      setError(t("createThreadFailed"));
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
      {/* Type toggle — segmented control, same anatomy as the sort tabs and
          type filters (it selects a mode; it is not an action button) */}
      <div
        role="radiogroup"
        aria-label={t("threadType")}
        className="inline-flex gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface)] p-0.5"
      >
        {(["question", "discussion"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={type === value}
            onClick={() => setType(value)}
            className={cn(
              "whitespace-nowrap rounded-md font-medium transition-colors",
              compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-[13px]",
              type === value
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-2)] hover:bg-[var(--card-hover)] hover:text-[var(--text)]"
            )}
          >
            {t(value)}
          </button>
        ))}
      </div>

      {/* Category selector (hidden for course-scoped threads) */}
      {!isCourseScoped && (
        <div>
          <label
            htmlFor="thread-composer-category"
            className={cn(
              "mb-1 block font-medium text-[var(--text)]",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {t("category")}
          </label>
          <select
            id="thread-composer-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={cn(
              "w-full rounded-md border border-[var(--border-default)] bg-[var(--input)] px-3 py-2 text-[var(--text)] focus:outline-none",
              compact ? "text-[13px]" : "text-sm"
            )}
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
          className={cn(
            "mb-1 block font-medium text-[var(--text)]",
            compact ? "text-xs" : "text-sm"
          )}
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
            className={cn(
              "w-full bg-transparent px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-2)] focus:outline-none",
              compact ? "text-[13px]" : "text-sm"
            )}
          />
          <p className="px-3 pb-1.5 text-right text-xs text-[var(--text-2)]">
            {title.length}/200
          </p>
        </div>
      </div>

      {/* Body */}
      <div>
        <label
          className={cn(
            "mb-1 block font-medium text-[var(--text)]",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {t("detailsLabel")}
        </label>
        <MarkdownEditor
          value={body}
          onChange={setBody}
          placeholder={t("detailsPlaceholder")}
          minHeight={compact ? "120px" : "160px"}
          compact={compact}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {/* Footer actions stay sm on every surface — the default size read as
          oversized against the form's 13px chrome (owner 2026-08-02) */}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button
          variant="primary"
          size="sm"
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
