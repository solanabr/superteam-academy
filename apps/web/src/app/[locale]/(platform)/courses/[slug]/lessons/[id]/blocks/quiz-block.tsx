"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuizBlockData } from "@/lib/sanity/types";
import type { BlockRenderProps } from "./types";

/**
 * Collects the learner's option selections into a `QuizProof`
 * (`{ selections: { [questionId]: optionId[] } }`) and reports it upward via
 * `ctx.setProof`. Grading is server-side (set equality) — the client never
 * decides correctness.
 */
export function QuizBlock({ block, ctx }: BlockRenderProps) {
  const b = block as QuizBlockData;
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    ctx.setProof(b.key, { selections });
  }, [selections, b.key, ctx]);

  const toggle = useCallback(
    (questionId: string, optionId: string, multi: boolean) => {
      setSelections((prev) => {
        const current = prev[questionId] ?? [];
        if (multi) {
          const next = current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId];
          return { ...prev, [questionId]: next };
        }
        return { ...prev, [questionId]: [optionId] };
      });
    },
    []
  );

  return (
    <div className="space-y-6 rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-5 shadow-card">
      {b.questions.map((q) => {
        const multi = q.multiSelect ?? false;
        const chosen = selections[q.id] ?? [];
        return (
          <fieldset key={q.id} className="space-y-2">
            <legend className="font-display font-bold text-text">
              {q.prompt}
            </legend>
            <div className="space-y-1.5">
              {q.options.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 text-sm transition-colors hover:bg-subtle"
                >
                  <input
                    type={multi ? "checkbox" : "radio"}
                    name={q.id}
                    value={o.id}
                    checked={chosen.includes(o.id)}
                    onChange={() => toggle(q.id, o.id, multi)}
                    className="accent-primary"
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
