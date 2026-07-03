"use client";

import { useState, useEffect, useCallback } from "react";

interface TeacherRow {
  id: string;
  username: string;
  role: string;
}

export function TeacherRolesPanel() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);

  const loadTeachers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/teachers");
      if (!res.ok) return;
      const body = (await res.json()) as { teachers?: TeacherRow[] };
      setTeachers(body.teachers ?? []);
    } catch {
      // Non-critical: the list is a convenience view.
    }
  }, []);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  async function submit(action: "grant" | "revoke", name?: string) {
    const trimmed = (name ?? username).trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed, action }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        username?: string;
      };
      if (!res.ok) {
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }
      setNotice(
        action === "grant"
          ? `Granted teacher to @${body.username}`
          : `Revoked teacher from @${body.username}`
      );
      if (!name) setUsername("");
      await loadTeachers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-3">
        Grant or revoke the <span className="font-medium">teacher</span> role by
        username. Teachers can author their own courses under{" "}
        <span className="font-mono">/teach</span>; publishing on-chain still
        requires admin review. Admin accounts cannot be changed here.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          className="min-w-48 flex-1 rounded-md border border-border bg-[var(--input)] px-3 py-2 text-sm text-text"
          aria-label="Username"
        />
        <button
          type="button"
          onClick={() => void submit("grant")}
          disabled={loading || !username.trim()}
          className="rounded-md border border-success bg-success-light px-3 py-2 text-sm font-medium text-success disabled:opacity-50"
        >
          Grant teacher
        </button>
        <button
          type="button"
          onClick={() => void submit("revoke")}
          disabled={loading || !username.trim()}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium text-text disabled:opacity-50"
        >
          Revoke
        </button>
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

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-text-3">
          Current teachers ({teachers.length})
        </h4>
        {teachers.length === 0 ? (
          <p className="text-sm text-text-3">No teachers yet.</p>
        ) : (
          <ul className="space-y-1">
            {teachers.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <span className="font-mono text-text">@{t.username}</span>
                <button
                  type="button"
                  onClick={() => void submit("revoke", t.username)}
                  disabled={loading}
                  className="text-xs text-danger underline hover:no-underline disabled:opacity-50"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
