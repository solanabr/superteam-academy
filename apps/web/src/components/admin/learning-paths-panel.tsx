"use client";

import { useState, useEffect, useCallback } from "react";

interface AdminPath {
  _id: string;
  title: string;
  courseIds: string[];
}
interface PickerCourse {
  _id: string;
  title: string;
  slug: string | null;
}

export function LearningPathsPanel() {
  const [paths, setPaths] = useState<AdminPath[]>([]);
  const [courses, setCourses] = useState<PickerCourse[]>([]);
  // Per-path working selection (course id set), edited before Save.
  const [selection, setSelection] = useState<Record<string, Set<string>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/learning-paths");
      if (!res.ok) return;
      const body = (await res.json()) as {
        paths?: AdminPath[];
        courses?: PickerCourse[];
      };
      const nextPaths = body.paths ?? [];
      setPaths(nextPaths);
      setCourses(body.courses ?? []);
      setSelection(
        Object.fromEntries(nextPaths.map((p) => [p._id, new Set(p.courseIds)]))
      );
    } catch {
      // Non-critical convenience view.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(pathId: string, courseId: string) {
    setSelection((prev) => {
      const current = new Set(prev[pathId] ?? []);
      if (current.has(courseId)) current.delete(courseId);
      else current.add(courseId);
      return { ...prev, [pathId]: current };
    });
  }

  async function save(pathId: string) {
    setSavingId(pathId);
    setError(null);
    setNotice(null);
    try {
      const courseIds = Array.from(selection[pathId] ?? []);
      const res = await fetch("/api/admin/learning-paths", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathId, courseIds }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }
      setNotice("Saved");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-3">
        Assign courses to learning paths. Changes take effect on the courses
        page after saving.
      </p>

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

      {paths.length === 0 ? (
        <p className="text-sm text-text-3">No learning paths yet.</p>
      ) : (
        <div className="space-y-4">
          {paths.map((path) => {
            const selected = selection[path._id] ?? new Set<string>();
            return (
              <div
                key={path._id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-display text-sm font-bold text-text">
                    {path.title}{" "}
                    <span className="font-sans text-xs font-normal text-text-3">
                      ({selected.size})
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => void save(path._id)}
                    disabled={savingId === path._id}
                    className="rounded-md border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {savingId === path._id ? "Saving…" : "Save"}
                  </button>
                </div>
                {courses.length === 0 ? (
                  <p className="text-xs text-text-3">No courses available.</p>
                ) : (
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {courses.map((course) => (
                      <li key={course._id}>
                        <label className="flex items-center gap-2 text-sm text-text">
                          <input
                            type="checkbox"
                            checked={selected.has(course._id)}
                            onChange={() => toggle(path._id, course._id)}
                          />
                          {course.title}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
