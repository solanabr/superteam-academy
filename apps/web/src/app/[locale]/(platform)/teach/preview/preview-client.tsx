"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowSquareOut,
  BookOpen,
  Lightning,
  Lock,
  Warning,
} from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import { parsePrUrl } from "@/lib/teach/pr-url";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PreviewLesson {
  _id: string;
  slug: string;
  title: string;
  blocks: { _type: string }[];
}

interface PreviewCourse {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  difficulty?: string;
}

interface PreviewHead {
  sha: string;
  title: string;
  author: string | null;
  branch: string | null;
  state: string;
}

interface PreviewResult {
  head: PreviewHead;
  courses: PreviewCourse[];
  lessonsByCourse: Record<string, PreviewLesson[]>;
  /** Per-course XP (the projected Course does not carry it). */
  xpPerLessonById: Record<string, number>;
  counts: Record<string, number>;
}

/** Human label for a block `_type` (`openEnded` → "Open ended"). */
function blockLabel(type: string): string {
  const spaced = type.replace(/([A-Z])/g, " $1").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function TeachPreviewClient() {
  const t = useTranslations("teachPreview");
  const locale = useLocale();

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [prUrl, setPrUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[] | null>(null);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  // PR number of the rendered result, for links into the full-page preview.
  const [prNumber, setPrNumber] = useState<number | null>(null);

  // Resolve the existing session on mount so a returning teacher (24h cookie)
  // skips the password step.
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/teach/preview/auth")
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((body: { authenticated?: boolean }) => {
        if (!cancelled) setAuthed(body.authenticated === true);
      })
      .catch(() => {
        if (!cancelled) setAuthed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submitPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthBusy(true);
      setAuthError(null);
      try {
        const res = await fetch("/api/teach/preview/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (res.ok) {
          setAuthed(true);
          setPassword("");
        } else {
          const body = (await res.json()) as { error?: string };
          setAuthError(body.error ?? t("auth.invalid"));
        }
      } catch {
        setAuthError(t("errors.network"));
      } finally {
        setAuthBusy(false);
      }
    },
    [password, t]
  );

  const submitPreview = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setError(null);
      setIssues(null);
      setResult(null);
      setOpenCourseId(null);
      try {
        const res = await fetch("/api/teach/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prUrl }),
        });
        const body = (await res.json()) as Partial<PreviewResult> & {
          error?: string;
          issues?: string[];
        };

        if (res.status === 401) {
          setAuthed(false);
          return;
        }
        if (res.status === 422 && body.issues) {
          setIssues(body.issues);
          return;
        }
        if (!res.ok) {
          setError(body.error ?? t("errors.generic"));
          return;
        }

        const loaded = body as PreviewResult;
        setResult(loaded);
        {
          // Same parser the server uses — an ad-hoc regex here broke on a
          // trailing slash (`/pull/24/`), which silently hid every preview link.
          const parsed = parsePrUrl(prUrl);
          setPrNumber(parsed.ok ? parsed.number : null);
        }
        setOpenCourseId(loaded.courses[0]?._id ?? null);
      } catch {
        setError(t("errors.network"));
      } finally {
        setBusy(false);
      }
    },
    [prUrl, t]
  );

  if (authed === null) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="sol-spinner" aria-hidden="true" />
        <span className="sr-only">{t("loading")}</span>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md py-12">
        <div className="rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Lock size={20} weight="duotone" className="text-primary" />
            <h1 className="font-display text-lg font-black text-text">
              {t("auth.title")}
            </h1>
          </div>
          <p className="mb-4 text-sm text-text-3">{t("auth.body")}</p>
          <form onSubmit={submitPassword} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.placeholder")}
              aria-label={t("auth.placeholder")}
              autoComplete="current-password"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
            {authError && (
              <p role="alert" className="text-sm text-danger">
                {authError}
              </p>
            )}
            <Button
              type="submit"
              variant="push"
              size="default"
              disabled={authBusy || password.length === 0}
              className="w-full"
            >
              {t("auth.submit")}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-black text-text">
          {t("title")}
        </h1>
        <p className="text-sm text-text-3">{t("subtitle")}</p>
      </header>

      <form
        onSubmit={submitPreview}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="text"
          value={prUrl}
          onChange={(e) => setPrUrl(e.target.value)}
          placeholder={t("form.placeholder")}
          aria-label={t("form.placeholder")}
          className="min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <Button
          type="submit"
          variant="push"
          size="default"
          disabled={busy || prUrl.trim().length === 0}
          className="gap-2 sm:w-auto"
        >
          {busy && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden="true"
            />
          )}
          {busy ? t("form.loading") : t("form.submit")}
        </Button>
      </form>

      {error && (
        <p
          role="alert"
          className="rounded-md border p-3 text-sm text-danger [background:var(--danger-light)] [border-color:var(--danger-border)]"
        >
          {error}
        </p>
      )}

      {issues && (
        <div
          role="alert"
          className="space-y-2 rounded-md border p-4 [background:var(--danger-light)] [border-color:var(--danger-border)]"
        >
          <p className="flex items-center gap-2 text-sm font-bold text-danger">
            <Warning size={16} weight="duotone" aria-hidden="true" />
            {t("issues.title", { count: issues.length })}
          </p>
          <p className="text-xs text-text-3">{t("issues.body")}</p>
          <ul className="space-y-1">
            {issues.map((issue, i) => (
              <li
                key={i}
                className="rounded bg-subtle px-2 py-1 font-mono text-xs text-text"
              >
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-xs font-bold uppercase text-text-3 [background:var(--input)]">
                {result.head.state}
              </span>
              <span className="font-display font-bold text-text">
                {result.head.title}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-3">
              {t("head.meta", {
                author: result.head.author ?? "unknown",
                branch: result.head.branch ?? "unknown",
                sha: result.head.sha.slice(0, 7),
              })}
            </p>
          </div>

          {result.courses.length === 0 ? (
            <p className="rounded-md border border-border p-4 text-sm text-text-3">
              {t("empty")}
            </p>
          ) : (
            result.courses.map((course) => {
              const lessons = result.lessonsByCourse[course._id] ?? [];
              const open = openCourseId === course._id;
              return (
                <div
                  key={course._id}
                  className="overflow-hidden rounded-[var(--r-lg)] border-[2.5px] border-border bg-card shadow-card"
                >
                  <button
                    type="button"
                    onClick={() => setOpenCourseId(open ? null : course._id)}
                    aria-expanded={open}
                    className="flex w-full items-start gap-3 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <BookOpen
                      size={20}
                      weight="duotone"
                      className="mt-0.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-lg font-black text-text">
                        {course.title}
                      </h2>
                      {course.description && (
                        <p className="mt-1 text-sm text-text-3">
                          {course.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-3">
                        <span className="font-mono">{course.slug}</span>
                        {course.difficulty && (
                          <span className="rounded-full px-2 py-0.5 [background:var(--input)]">
                            {course.difficulty}
                          </span>
                        )}
                        <span>
                          {t("course.lessons", { count: lessons.length })}
                        </span>
                        {result.xpPerLessonById[course._id] != null && (
                          <span className="flex items-center gap-1 text-xp">
                            <Lightning size={12} weight="fill" />+
                            {result.xpPerLessonById[course._id]} XP
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* The real thing (#831): open the course exactly as a
                      learner sees it, with every lesson reachable. */}
                  {prNumber !== null && (
                    <div className="border-t border-border px-5 py-3">
                      <Button variant="push" size="sm" asChild>
                        <a
                          href={`/${locale}/teach/preview/${prNumber}/courses/${course.slug}`}
                        >
                          {t("openCourse")}
                        </a>
                      </Button>
                    </div>
                  )}

                  <ul
                    className={cn(
                      "divide-y divide-border border-t border-border",
                      !open && "hidden"
                    )}
                  >
                    {lessons.map((lesson, i) => (
                      <li key={lesson._id} className="px-5 py-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-xs text-text-3">
                            {i + 1}
                          </span>
                          {prNumber !== null ? (
                            <a
                              href={`/${locale}/teach/preview/${prNumber}/courses/${course.slug}/lessons/${lesson.slug}`}
                              className="font-medium text-text underline-offset-2 hover:text-primary hover:underline"
                            >
                              {lesson.title}
                            </a>
                          ) : (
                            <span className="font-medium text-text">
                              {lesson.title}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {lesson.blocks.map((b, bi) => (
                            <span
                              key={bi}
                              className="rounded px-1.5 py-0.5 text-[11px] text-text-3 [background:var(--input)]"
                            >
                              {blockLabel(b._type)}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}

          <a
            href={`https://github.com/solanabr/courses-academy/commit/${result.head.sha}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-text-3 underline-offset-2 hover:text-text hover:underline"
          >
            <ArrowSquareOut size={14} weight="bold" aria-hidden="true" />
            {t("viewCommit")}
          </a>
        </div>
      )}
    </div>
  );
}
