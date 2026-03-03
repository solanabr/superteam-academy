"use client";

import { useState, useRef, useEffect } from "react";
import { X, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ThreadCategory, CreateThreadPayload } from "@/types";

const CATEGORIES: ThreadCategory[] = [
  "Help",
  "Show & Tell",
  "Ideas",
  "General",
];

interface NewThreadDialogProps {
  onClose: () => void;
  onSubmit: (data: CreateThreadPayload) => void;
}

export function NewThreadDialog({ onClose, onSubmit }: NewThreadDialogProps) {
  const t = useTranslations("discussions");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ThreadCategory>("General");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    onSubmit({
      title: title.trim(),
      body: body.trim(),
      scope: "community",
      category,
      tags: tags
        .split(",")
        .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean),
    });
    onClose();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="glass w-full max-w-xl rounded-2xl p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">{t("newThread")}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {t("titleLabel")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {t("categoryLabel")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ThreadCategory)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
              <Tag className="h-3.5 w-3.5" />
              {t("tagsLabel")}
              <span className="font-normal text-muted-foreground">
                ({t("tagsHint")})
              </span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="anchor, pda, token-2022"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {t("bodyLabel")}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("bodyPlaceholder")}
              required
              rows={6}
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !body.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {t("postThread")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
