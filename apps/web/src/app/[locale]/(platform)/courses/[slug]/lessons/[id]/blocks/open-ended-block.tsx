"use client";

import { useState } from "react";
import type { OpenEndedBlockData } from "@superteam-lms/types";
import type { BlockRenderProps } from "./types";

/**
 * A reflection prompt (spec §8, D5): feedback-only, never graded, never mints XP.
 * The completion gate requires a SEALED ATTESTATION that the server saw a
 * submission — issued by the §8 reflection endpoint (a scoped follow-up). This
 * renderer shows the prompt and captures the learner's text; wiring the endpoint
 * that returns the attestation token is tracked separately, so it does not
 * fabricate a proof here (the gate stays fail-closed until a real token exists).
 */
export function OpenEndedBlock({ block }: BlockRenderProps) {
  const b = block as OpenEndedBlockData;
  const [text, setText] = useState("");
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const maxWords = b.maxWords ?? 200;

  return (
    <div className="space-y-3 rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-5 shadow-card">
      <p className="font-display font-bold text-text">{b.prompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        className="w-full rounded-md border border-border p-2 text-sm [background:var(--input)]"
        aria-label={b.prompt}
      />
      <p className="text-right font-mono text-xs text-text-3">
        {words}/{maxWords}
      </p>
    </div>
  );
}
