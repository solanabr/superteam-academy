"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle } from "@phosphor-icons/react";
import type { OpenEndedBlockData } from "@superteam-lms/types";
import { Button } from "@/components/ui/button";
import type { BlockRenderProps } from "./types";

interface ReflectResponse {
  seal: string;
  reply: string | null;
}

/** Shape persisted per block so a refresh never loses a submitted reflection. */
interface StoredReflection {
  text: string;
  seal: string;
  reply: string | null;
}

/**
 * A reflection prompt (spec §8, D5): feedback-only, never graded, never mints XP.
 * The completion gate requires a SEALED ATTESTATION that the server saw a
 * submission. This renderer captures the learner's text, POSTs it to
 * `/api/lessons/reflect`, and records the returned seal as this block's proof via
 * `ctx.setProof` — so the completion POST carries it. The AI reply is ONE round
 * of feedback (never a chat) and never gates submission (receipt-first ruling).
 *
 * Submitted state persists in localStorage (like quiz-state): a refresh
 * restores the text, the seal (re-registered as proof), the AI reply, and the
 * done state — so the completion gate stays satisfied across reloads.
 */
export function OpenEndedBlock({ block, ctx }: BlockRenderProps) {
  const b = block as OpenEndedBlockData;
  const t = useTranslations("lesson");
  const storageKey = `reflect-state:${ctx.lesson._id}:${b.key}`;
  const [text, setText] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const [reply, setReply] = useState<string | null>(null);
  const restoredRef = useRef(false);

  // Restore a previously sealed submission (once, before first paint effect).
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const stored = JSON.parse(raw) as StoredReflection;
      if (typeof stored.seal !== "string" || stored.seal === "") return;
      setText(typeof stored.text === "string" ? stored.text : "");
      setReply(typeof stored.reply === "string" ? stored.reply : null);
      setStatus("done");
      ctx.setProof(b.key, stored.seal);
    } catch {
      /* corrupt/blocked storage — start fresh */
    }
  }, [storageKey, b.key, ctx]);

  // The completion gate follows the seal, restored or fresh.
  useEffect(() => {
    ctx.setBlockDone(b.key, status === "done");
  }, [status, b.key, ctx]);

  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const maxWords = b.maxWords ?? 200;
  const overLimit = words > maxWords;
  // One round only (#848): once the seal is recorded (status "done"), the
  // submit affordance stays disabled — the AI reply is a single round of
  // feedback, not a chat. Errors still allow a retry.
  const canSubmit =
    words > 0 && !overLimit && (status === "idle" || status === "error");

  const submit = async () => {
    if (!canSubmit) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/lessons/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: ctx.courseId,
          lessonId: ctx.lesson._id,
          blockKey: b.key,
          text,
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = (await res.json()) as ReflectResponse;
      ctx.setProof(b.key, data.seal);
      setReply(data.reply);
      setStatus("done");
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            text,
            seal: data.seal,
            reply: data.reply,
          } satisfies StoredReflection)
        );
      } catch {
        /* storage full/blocked — persistence is best-effort */
      }
    } catch {
      setStatus("error");
    }
  };

  const isDone = status === "done";

  return (
    <div className="space-y-3 rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-5 shadow-card">
      <p className="font-display font-bold text-text">{b.prompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        readOnly={isDone}
        className="w-full rounded-md border border-border p-2 text-sm [background:var(--input)] read-only:opacity-80"
        aria-label={b.prompt}
        aria-describedby={`${b.key}-count`}
      />
      <div className="flex items-center justify-between gap-3">
        <p
          id={`${b.key}-count`}
          className={`font-mono text-xs ${overLimit ? "text-danger" : "text-text-3"}`}
        >
          {words}/{maxWords}
        </p>
        {isDone ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary-border)] bg-[var(--primary-dim)] px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.4px] text-primary">
            <CheckCircle size={14} weight="fill" aria-hidden="true" />
            {t("reflectionSubmitted")}
          </span>
        ) : (
          <Button
            variant="pushSuccess"
            size="sm"
            onClick={submit}
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
          >
            {status === "submitting" ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
                <span className="sr-only">{t("reflectionSubmitting")}</span>
              </>
            ) : (
              t("reflectionSubmit")
            )}
          </Button>
        )}
      </div>

      {/* aria-live so a screen reader announces the outcome after submit. */}
      <div aria-live="polite">
        {status === "error" && (
          <p role="alert" className="text-sm text-danger">
            {t("reflectionError")}
          </p>
        )}
        {isDone && reply && (
          <div className="space-y-1 rounded-md border border-border bg-subtle p-3">
            <p className="font-display text-xs font-bold uppercase tracking-wide text-text-3">
              {t("reflectionReplyLabel")}
            </p>
            <p className="text-sm text-text">{reply}</p>
          </div>
        )}
      </div>
    </div>
  );
}
