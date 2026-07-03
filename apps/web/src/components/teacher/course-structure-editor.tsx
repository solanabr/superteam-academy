"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

let counter = 0;
const nextKey = () => `k${++counter}`;

interface TestRow {
  key: string;
  id: string;
  description: string;
  input: string;
  expectedOutput: string;
  hidden: boolean;
}
interface LessonRow {
  key: string;
  _id?: string;
  title: string;
  type: "content" | "challenge";
  content: string;
  videoUrl: string;
  language: string;
  buildType: string;
  code: string;
  solution: string;
  hints: string;
  tests: TestRow[];
}
interface ModuleRow {
  key: string;
  _id?: string;
  title: string;
  description: string;
  lessons: LessonRow[];
}

interface ReadTest {
  id: string | null;
  description: string | null;
  input: string | null;
  expectedOutput: string | null;
  hidden: boolean | null;
}
interface ReadLesson {
  _id: string;
  title: string | null;
  type: string | null;
  content: string | null;
  videoUrl: string | null;
  language: string | null;
  buildType: string | null;
  code: string | null;
  solution: string | null;
  hints: string[] | null;
  tests: ReadTest[] | null;
}
interface ReadModule {
  _id: string;
  title: string | null;
  description: string | null;
  lessons: ReadLesson[] | null;
}

const input =
  "w-full rounded-md border border-border bg-[var(--input)] px-2.5 py-1.5 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const iconBtn =
  "rounded border border-border px-2 py-1 text-xs text-text-2 disabled:opacity-40";

function emptyLesson(): LessonRow {
  return {
    key: nextKey(),
    title: "",
    type: "content",
    content: "",
    videoUrl: "",
    language: "typescript",
    buildType: "standard",
    code: "",
    solution: "",
    hints: "",
    tests: [],
  };
}

function mapRead(modules: ReadModule[]): ModuleRow[] {
  return modules.map((m) => ({
    key: nextKey(),
    _id: m._id,
    title: m.title ?? "",
    description: m.description ?? "",
    lessons: (m.lessons ?? []).map((l) => ({
      key: nextKey(),
      _id: l._id,
      title: l.title ?? "",
      type: l.type === "challenge" ? "challenge" : "content",
      content: l.content ?? "",
      videoUrl: l.videoUrl ?? "",
      language: l.language ?? "typescript",
      buildType: l.buildType ?? "standard",
      code: l.code ?? "",
      solution: l.solution ?? "",
      hints: (l.hints ?? []).join("\n"),
      tests: (l.tests ?? []).map((t) => ({
        key: nextKey(),
        id: t.id ?? "",
        description: t.description ?? "",
        input: t.input ?? "",
        expectedOutput: t.expectedOutput ?? "",
        hidden: t.hidden === true,
      })),
    })),
  }));
}

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  return copy;
}

export function CourseStructureEditor({ courseId }: { courseId: string }) {
  const t = useTranslations("teacher.builder");
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teacher/courses/${courseId}/structure`);
      if (!res.ok) {
        setError(t("loadError"));
        return;
      }
      const data = (await res.json()) as { modules: ReadModule[] };
      setModules(mapRead(data.modules ?? []));
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [courseId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  // --- nested immutable updaters ---
  const setModule = (mi: number, patch: Partial<ModuleRow>) =>
    setModules((p) => p.map((m, i) => (i === mi ? { ...m, ...patch } : m)));
  const setLesson = (mi: number, li: number, patch: Partial<LessonRow>) =>
    setModules((p) =>
      p.map((m, i) =>
        i === mi
          ? {
              ...m,
              lessons: m.lessons.map((l, j) =>
                j === li ? { ...l, ...patch } : l
              ),
            }
          : m
      )
    );
  const setTest = (mi: number, li: number, ti: number, patch: Partial<TestRow>) =>
    setLesson(mi, li, {
      tests: modules[mi]!.lessons[li]!.tests.map((tr, k) =>
        k === ti ? { ...tr, ...patch } : tr
      ),
    });

  async function save() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload = {
        modules: modules.map((m) => ({
          ...(m._id ? { _id: m._id } : {}),
          title: m.title.trim(),
          description: m.description.trim() || undefined,
          lessons: m.lessons.map((l) => {
            const base: Record<string, unknown> = {
              ...(l._id ? { _id: l._id } : {}),
              title: l.title.trim(),
              type: l.type,
            };
            if (l.type === "content") {
              if (l.content.trim()) base.content = l.content;
              if (l.videoUrl.trim()) base.videoUrl = l.videoUrl.trim();
            } else {
              base.language = l.language;
              base.buildType = l.buildType;
              if (l.code.trim()) base.code = l.code;
              if (l.solution.trim()) base.solution = l.solution;
              const hints = l.hints
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
              if (hints.length) base.hints = hints;
              base.tests = l.tests.map((tr) => ({
                id: tr.id.trim() || tr.key,
                description: tr.description.trim(),
                input: tr.input,
                expectedOutput: tr.expectedOutput,
                hidden: tr.hidden,
              }));
            }
            return base;
          }),
        })),
      };
      const res = await fetch(
        `/api/teacher/courses/${courseId}/structure`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setNotice(t("saved"));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-text-3">…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-text">
          {t("heading")}
        </h2>
        <button
          type="button"
          onClick={() =>
            setModules((p) => [
              ...p,
              { key: nextKey(), title: "", description: "", lessons: [] },
            ])
          }
          className={iconBtn}
        >
          + {t("addModule")}
        </button>
      </div>

      {modules.length === 0 && (
        <p className="text-sm text-text-3">{t("empty")}</p>
      )}

      {modules.map((m, mi) => (
        <div
          key={m.key}
          className="rounded-lg border border-border bg-card p-4 shadow-card"
        >
          <div className="mb-2 flex items-center gap-2">
            <input
              className={input}
              placeholder={t("moduleTitle")}
              value={m.title}
              onChange={(e) => setModule(mi, { title: e.target.value })}
            />
            <button
              type="button"
              aria-label={t("up")}
              className={iconBtn}
              disabled={mi === 0}
              onClick={() => setModules((p) => move(p, mi, -1))}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={t("down")}
              className={iconBtn}
              disabled={mi === modules.length - 1}
              onClick={() => setModules((p) => move(p, mi, 1))}
            >
              ↓
            </button>
            <button
              type="button"
              className={`${iconBtn} text-danger`}
              onClick={() =>
                setModules((p) => p.filter((_, i) => i !== mi))
              }
            >
              {t("remove")}
            </button>
          </div>
          <textarea
            className={`${input} mb-3`}
            rows={2}
            placeholder={t("moduleDescription")}
            value={m.description}
            onChange={(e) => setModule(mi, { description: e.target.value })}
          />

          <div className="space-y-3 border-l border-border pl-3">
            {m.lessons.map((l, li) => (
              <div key={l.key} className="rounded-md border border-border p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <input
                    className={input}
                    placeholder={t("lessonTitle")}
                    value={l.title}
                    onChange={(e) =>
                      setLesson(mi, li, { title: e.target.value })
                    }
                  />
                  <select
                    className="rounded-md border border-border bg-[var(--input)] px-2 py-1.5 text-sm"
                    aria-label={t("lessonType")}
                    value={l.type}
                    onChange={(e) =>
                      setLesson(mi, li, {
                        type: e.target.value as "content" | "challenge",
                      })
                    }
                  >
                    <option value="content">{t("content")}</option>
                    <option value="challenge">{t("challenge")}</option>
                  </select>
                  <button
                    type="button"
                    aria-label={t("up")}
                    className={iconBtn}
                    disabled={li === 0}
                    onClick={() =>
                      setModule(mi, { lessons: move(m.lessons, li, -1) })
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={t("down")}
                    className={iconBtn}
                    disabled={li === m.lessons.length - 1}
                    onClick={() =>
                      setModule(mi, { lessons: move(m.lessons, li, 1) })
                    }
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={`${iconBtn} text-danger`}
                    onClick={() =>
                      setModule(mi, {
                        lessons: m.lessons.filter((_, j) => j !== li),
                      })
                    }
                  >
                    {t("remove")}
                  </button>
                </div>

                {l.type === "content" ? (
                  <div className="space-y-2">
                    <textarea
                      className={input}
                      rows={3}
                      placeholder={t("contentBody")}
                      value={l.content}
                      onChange={(e) =>
                        setLesson(mi, li, { content: e.target.value })
                      }
                    />
                    <input
                      className={input}
                      placeholder={t("videoUrl")}
                      value={l.videoUrl}
                      onChange={(e) =>
                        setLesson(mi, li, { videoUrl: e.target.value })
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        className="rounded-md border border-border bg-[var(--input)] px-2 py-1.5 text-sm"
                        aria-label={t("language")}
                        value={l.language}
                        onChange={(e) =>
                          setLesson(mi, li, { language: e.target.value })
                        }
                      >
                        <option value="typescript">TypeScript</option>
                        <option value="rust">Rust</option>
                      </select>
                      <select
                        className="rounded-md border border-border bg-[var(--input)] px-2 py-1.5 text-sm"
                        aria-label={t("buildType")}
                        value={l.buildType}
                        onChange={(e) =>
                          setLesson(mi, li, { buildType: e.target.value })
                        }
                      >
                        <option value="standard">{t("standard")}</option>
                        <option value="buildable">{t("buildable")}</option>
                      </select>
                    </div>
                    <textarea
                      className={`${input} font-mono`}
                      rows={4}
                      placeholder={t("starterCode")}
                      value={l.code}
                      onChange={(e) =>
                        setLesson(mi, li, { code: e.target.value })
                      }
                    />
                    <textarea
                      className={`${input} font-mono`}
                      rows={4}
                      placeholder={t("solution")}
                      value={l.solution}
                      onChange={(e) =>
                        setLesson(mi, li, { solution: e.target.value })
                      }
                    />
                    <textarea
                      className={input}
                      rows={2}
                      placeholder={`${t("hints")} — ${t("hintsHint")}`}
                      value={l.hints}
                      onChange={(e) =>
                        setLesson(mi, li, { hints: e.target.value })
                      }
                    />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-text-3">
                          {t("tests")}
                        </span>
                        <button
                          type="button"
                          className={iconBtn}
                          onClick={() =>
                            setLesson(mi, li, {
                              tests: [
                                ...l.tests,
                                {
                                  key: nextKey(),
                                  id: "",
                                  description: "",
                                  input: "",
                                  expectedOutput: "",
                                  hidden: false,
                                },
                              ],
                            })
                          }
                        >
                          + {t("addTest")}
                        </button>
                      </div>
                      {l.tests.map((tr, ti) => (
                        <div
                          key={tr.key}
                          className="grid gap-1.5 rounded border border-border p-2 sm:grid-cols-2"
                        >
                          <input
                            className={input}
                            placeholder={t("testDescription")}
                            value={tr.description}
                            onChange={(e) =>
                              setTest(mi, li, ti, {
                                description: e.target.value,
                              })
                            }
                          />
                          <label className="flex items-center gap-2 text-xs text-text-2">
                            <input
                              type="checkbox"
                              checked={tr.hidden}
                              onChange={(e) =>
                                setTest(mi, li, ti, { hidden: e.target.checked })
                              }
                            />
                            {t("hidden")}
                            <button
                              type="button"
                              className={`${iconBtn} ml-auto text-danger`}
                              onClick={() =>
                                setLesson(mi, li, {
                                  tests: l.tests.filter((_, k) => k !== ti),
                                })
                              }
                            >
                              {t("remove")}
                            </button>
                          </label>
                          <textarea
                            className={`${input} font-mono`}
                            rows={2}
                            placeholder={t("testInput")}
                            value={tr.input}
                            onChange={(e) =>
                              setTest(mi, li, ti, { input: e.target.value })
                            }
                          />
                          <textarea
                            className={`${input} font-mono`}
                            rows={2}
                            placeholder={t("testExpected")}
                            value={tr.expectedOutput}
                            onChange={(e) =>
                              setTest(mi, li, ti, {
                                expectedOutput: e.target.value,
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              className={iconBtn}
              onClick={() =>
                setModule(mi, { lessons: [...m.lessons, emptyLesson()] })
              }
            >
              + {t("addLesson")}
            </button>
          </div>
        </div>
      ))}

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

      <button
        type="button"
        onClick={() => void save()}
        disabled={busy}
        className="rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {busy ? t("saving") : t("save")}
      </button>
    </div>
  );
}
