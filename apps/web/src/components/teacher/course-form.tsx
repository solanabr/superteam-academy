"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

interface CourseInitial {
  title?: string | null;
  description?: string | null;
  difficulty?: string | null;
  duration?: number | null;
  tags?: string[] | null;
  xpReward?: number | null;
  xpPerLesson?: number | null;
}

interface CourseFormProps {
  mode: "create" | "edit";
  courseId?: string;
  initial?: CourseInitial;
}

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const inputClass =
  "w-full rounded-md border border-border bg-[var(--input)] px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function CourseForm({ mode, courseId, initial }: CourseFormProps) {
  const t = useTranslations("teacher.form");
  const router = useRouter();
  const locale = useLocale();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [difficulty, setDifficulty] = useState(
    initial?.difficulty ?? "beginner"
  );
  const [duration, setDuration] = useState(
    initial?.duration != null ? String(initial.duration) : ""
  );
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [xpReward, setXpReward] = useState(
    initial?.xpReward != null ? String(initial.xpReward) : ""
  );
  const [xpPerLesson, setXpPerLesson] = useState(
    initial?.xpPerLesson != null ? String(initial.xpPerLesson) : ""
  );

  const [busy, setBusy] = useState<null | "save" | "submit">(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function buildBody(extra?: Record<string, unknown>): Record<string, unknown> {
    const body: Record<string, unknown> = { title: title.trim(), difficulty };
    if (description.trim()) body.description = description.trim();
    const tagList = tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (tagList.length) body.tags = tagList;
    if (duration.trim()) {
      const n = Number(duration);
      if (Number.isFinite(n)) body.duration = n;
    }
    if (xpReward.trim()) {
      const n = Number(xpReward);
      if (Number.isInteger(n)) body.xpReward = n;
    }
    if (xpPerLesson.trim()) {
      const n = Number(xpPerLesson);
      if (Number.isInteger(n)) body.xpPerLesson = n;
    }
    return { ...body, ...extra };
  }

  async function persist(
    extra: Record<string, unknown> | undefined,
    which: "save" | "submit"
  ) {
    if (!title.trim()) {
      setError(t("titleRequired"));
      return;
    }
    setBusy(which);
    setError(null);
    setNotice(null);
    try {
      const url =
        mode === "create"
          ? "/api/teacher/courses"
          : `/api/teacher/courses/${courseId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(extra)),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        _id?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      if (which === "submit") {
        router.push(`/${locale}/teach/courses?submitted=1`);
        return;
      }
      if (mode === "create" && data._id) {
        router.push(`/${locale}/teach/courses/${data._id}/edit`);
        return;
      }
      setNotice(t("saved"));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void persist(undefined, "save");
      }}
    >
      <div>
        <label htmlFor="course-title" className="mb-1 block text-sm font-medium">
          {t("title")}
        </label>
        <input
          id="course-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="course-desc" className="mb-1 block text-sm font-medium">
          {t("description")}
        </label>
        <textarea
          id="course-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
          rows={4}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="course-difficulty"
            className="mb-1 block text-sm font-medium"
          >
            {t("difficulty")}
          </label>
          <select
            id="course-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className={inputClass}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {t(d)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="course-duration"
            className="mb-1 block text-sm font-medium"
          >
            {t("duration")}
          </label>
          <input
            id="course-duration"
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="course-tags" className="mb-1 block text-sm font-medium">
          {t("tags")}
        </label>
        <input
          id="course-tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-text-3">{t("tagsHint")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="course-xp" className="mb-1 block text-sm font-medium">
            {t("xpReward")}
          </label>
          <input
            id="course-xp"
            type="number"
            min={0}
            step={1}
            value={xpReward}
            onChange={(e) => setXpReward(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="course-xppl"
            className="mb-1 block text-sm font-medium"
          >
            {t("xpPerLesson")}
          </label>
          <input
            id="course-xppl"
            type="number"
            min={1}
            max={100}
            step={1}
            value={xpPerLesson}
            onChange={(e) => setXpPerLesson(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger bg-danger-light p-3 text-sm text-danger">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-md border border-success bg-success-light p-3 text-sm text-success">
          {notice}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy !== null}
          className="rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy === "save" ? t("saving") : t("saveDraft")}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              void persist({ authoringStatus: "pending_review" }, "submit")
            }
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text disabled:opacity-50"
          >
            {busy === "submit" ? t("submitting") : t("submitForReview")}
          </button>
        )}
      </div>
    </form>
  );
}
