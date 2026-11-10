"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { VerifiedKind } from "@/lib/profiles/public-profile";
import { AdminButton } from "./admin-button";
import { AdminTableShell } from "./admin-table-shell";

interface VerifiedAuthor {
  id: string;
  username: string;
  displayName: string | null;
  verifiedKind: VerifiedKind | null;
  xUsername: string | null;
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; authors: VerifiedAuthor[] }
  | { status: "failed" };

type RowMessage = { type: "success" | "error"; key: string };

const SAVE_ERROR_KEY: Record<string, string> = {
  invalidHandle: "errorInvalidHandle",
  notVerified: "errorNotVerified",
};

/**
 * Verified authors and their X handles. The handle is admin-typed, like the
 * badge: it shows next to the author's badge on their courses and profile.
 */
export function AuthorsPanel() {
  const t = useTranslations("admin.authors");
  const tProfile = useTranslations("profile");
  const tStates = useTranslations("admin.states");
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, RowMessage>>({});

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/admin/authors");
      if (!res.ok) {
        setState({ status: "failed" });
        return;
      }
      const { authors } = (await res.json()) as { authors: VerifiedAuthor[] };
      setState({ status: "ready", authors });
      setDrafts(
        Object.fromEntries(authors.map((a) => [a.id, a.xUsername ?? ""]))
      );
    } catch {
      setState({ status: "failed" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (author: VerifiedAuthor) => {
    setSavingId(author.id);
    setMessages((prev) => {
      const next = { ...prev };
      delete next[author.id];
      return next;
    });
    try {
      const res = await fetch("/api/admin/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: author.id,
          xUsername: drafts[author.id]?.trim() || null,
        }),
      });
      const body = (await res.json()) as {
        xUsername?: string | null;
        error?: string;
      };
      if (!res.ok) {
        setMessages((prev) => ({
          ...prev,
          [author.id]: {
            type: "error",
            key: SAVE_ERROR_KEY[body.error ?? ""] ?? "errorSave",
          },
        }));
        return;
      }
      const saved = body.xUsername ?? null;
      setState((prev) =>
        prev.status === "ready"
          ? {
              status: "ready",
              authors: prev.authors.map((a) =>
                a.id === author.id ? { ...a, xUsername: saved } : a
              ),
            }
          : prev
      );
      setDrafts((prev) => ({ ...prev, [author.id]: saved ?? "" }));
      setMessages((prev) => ({
        ...prev,
        [author.id]: { type: "success", key: saved ? "saved" : "cleared" },
      }));
    } catch {
      setMessages((prev) => ({
        ...prev,
        [author.id]: { type: "error", key: "errorSave" },
      }));
    } finally {
      setSavingId(null);
    }
  };

  if (state.status === "loading") {
    return (
      <p role="status" className="text-sm text-text-3">
        {t("loading")}
      </p>
    );
  }

  if (state.status === "failed") {
    return (
      <div role="alert" className="space-y-2 text-sm text-danger">
        <p>{t("loadError")}</p>
        <AdminButton onClick={() => void load()}>
          {tStates("retry")}
        </AdminButton>
      </div>
    );
  }

  if (state.authors.length === 0) {
    return <p className="text-sm text-text-3">{t("empty")}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-3">{t("description")}</p>
      <AdminTableShell
        columns={[
          { key: "author", label: t("author") },
          { key: "kind", label: t("badge") },
          { key: "x", label: t("xHandle") },
        ]}
      >
        {state.authors.map((author) => {
          const name = author.displayName?.trim() || author.username;
          const draft = drafts[author.id] ?? "";
          const unchanged = draft.trim() === (author.xUsername ?? "");
          const message = messages[author.id];
          const inputId = `x-handle-${author.id}`;
          return (
            <tr key={author.id}>
              <td className="py-3 pr-4 align-top">
                <p className="font-semibold text-text">{name}</p>
                <p className="font-mono text-xs text-text-3">
                  @{author.username}
                </p>
              </td>
              <td className="py-3 pr-4 align-top text-text-2">
                {author.verifiedKind === "superteam"
                  ? tProfile("superteamMember")
                  : author.verifiedKind === "partner"
                    ? tProfile("verifiedPartner")
                    : tProfile("verifiedTeacher")}
              </td>
              <td className="py-3 align-top">
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save(author);
                  }}
                >
                  <label htmlFor={inputId} className="sr-only">
                    {t("xHandleFor", { name })}
                  </label>
                  <input
                    id={inputId}
                    type="text"
                    value={draft}
                    placeholder={t("placeholder")}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [author.id]: e.target.value,
                      }))
                    }
                    className="set-input min-w-[10rem] !py-1.5 text-sm"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <AdminButton
                    type="submit"
                    variant="primary"
                    disabled={unchanged || savingId === author.id}
                  >
                    {t("save")}
                  </AdminButton>
                </form>
                {message && (
                  <p
                    role={message.type === "error" ? "alert" : "status"}
                    className={`mt-1 text-xs ${
                      message.type === "error" ? "text-danger" : "text-success"
                    }`}
                  >
                    {t(message.key)}
                  </p>
                )}
              </td>
            </tr>
          );
        })}
      </AdminTableShell>
    </div>
  );
}
