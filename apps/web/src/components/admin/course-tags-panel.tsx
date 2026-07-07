"use client";

import { useState, useEffect, useCallback } from "react";

interface Tag {
  _id: string;
  name: string;
}

export function CourseTagsPanel() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tags");
      if (!res.ok) return;
      const body = (await res.json()) as { tags?: Tag[] };
      setTags(body.tags ?? []);
    } catch {
      // Non-critical convenience list.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-3">
        Manage the course-tag vocabulary. Teachers pick course tags from this
        list; removing a tag here doesn&apos;t change tags already saved on
        existing courses.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void add();
          }}
          placeholder="new tag (e.g. Rust)"
          maxLength={40}
          className="min-w-48 flex-1 rounded-md border border-border bg-[var(--input)] px-3 py-2 text-sm text-text"
          aria-label="New course tag"
        />
        <button
          type="button"
          onClick={() => void add()}
          disabled={loading || !name.trim()}
          className="rounded-md border border-success bg-success-light px-3 py-2 text-sm font-medium text-success disabled:opacity-50"
        >
          Add tag
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-danger bg-danger-light p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-text-3">
          Tags ({tags.length})
        </h4>
        {tags.length === 0 ? (
          <p className="text-sm text-text-3">No tags yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag._id}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-text"
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => void remove(tag._id)}
                  disabled={loading}
                  aria-label={`Remove ${tag.name}`}
                  className="text-danger hover:no-underline disabled:opacity-50"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
