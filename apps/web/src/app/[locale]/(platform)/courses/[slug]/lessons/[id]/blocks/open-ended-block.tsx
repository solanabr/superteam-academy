"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle } from "@phosphor-icons/react";
import type { OpenEndedBlockData } from "@superteam-lms/types";
import type { BlockRenderProps } from "./types";
import { Button } from "@/components/ui/button";

interface ReflectResponse {
  seal: string;
  reply: string | null;
}

/**
 * A reflection prompt (spec §8, D5): feedback-only, never graded, never mints XP.
 * The completion gate requires a SEALED ATTESTATION that the server saw a
 * submission. This renderer captures the learner's text, POSTs it to
 * `/api/lessons/reflect`, and records the returned seal as this block's proof via
 * `ctx.setProof` — so the completion POST carries it. The optional AI reply is
 * surfaced when present but never gates submission (receipt-first ruling).
 */
export function OpenEndedBlock({ block, ctx }: BlockRenderProps) {
  const b = block as OpenEndedBlockData;
  const t = useTranslations("lesson");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const [reply, setReply] = useState<string | null>(null);

  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const maxWords = b.maxWords ?? 200;
  const overLimit = words > maxWords;
  const canSubmit = words > 0 && !overLimit && status !== "submitting";

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
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-3 rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-5 shadow-card">
      <p className="font-display font-bold text-text">{b.prompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        className="w-full rounded-md border border-border p-2 text-sm [background:var(--input)]"
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
        <Button
          variant={status === "done" ? "outline" : "pushSuccess"}
          size="sm"
          onClick={submit}
          disabled={!canSubmit && status !== "error"}
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
          ) : status === "done" ? (
            <>
              <CheckCircle
                size={16}
                weight="duotone"
                className="text-success"
                aria-hidden="true"
              />
              {t("reflectionSubmitted")}
            </>
          ) : (
            t("reflectionSubmit")
          )}
        </Button>
      </div>

      {/* aria-live so a screen reader announces the outcome after submit. */}
      <div aria-live="polite">
        {status === "error" && (
          <p role="alert" className="text-sm text-danger">
            {t("reflectionError")}
          </p>
        )}
        {status === "done" && reply && (
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
