"use client";

import { useTranslations } from "next-intl";
import type { RunResult } from "./TestRunner";

interface TestResultsProps {
  result: RunResult | null;
  isRunning: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  runDisabledReason?: string | null;
  onRun: () => void;
  onSubmit: () => void;
  submitError: string | null;
  xpEarned: number | null;
  isComplete: boolean;
}

export function TestResults({
  result,
  isRunning,
  isSubmitting,
  canSubmit,
  runDisabledReason = null,
  onRun,
  onSubmit,
  submitError,
  xpEarned,
  isComplete,
}: TestResultsProps) {
  const t = useTranslations("TestResults");
  const passing = result?.results.filter((r) => r.passed).length ?? 0;
  const total = result?.results.length ?? 0;
  const allPass = total > 0 && passing === total;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex gap-2">
        <button
          onClick={onRun}
          disabled={isRunning || isSubmitting || Boolean(runDisabledReason)}
          className="flex-1 min-h-[40px] rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            color: isRunning ? "var(--text-muted)" : "var(--text-secondary)",
          }}
          title={runDisabledReason ?? undefined}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "var(--text-muted)",
                  borderTopColor: "var(--text-purple)",
                }}
              />
              {t("actions.running")}
            </span>
          ) : (
            t("actions.run")
          )}
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting || isComplete}
          className="flex-1 min-h-[40px] rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          style={
            isComplete
              ? {
                  background: "rgba(20,241,149,0.12)",
                  border: "1px solid rgba(20,241,149,0.3)",
                  color: "var(--solana-green)",
                }
              : canSubmit && !isSubmitting
                ? {
                    background: "var(--solana-purple)",
                    color: "#fff",
                    border: "none",
                  }
                : {
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                  }
          }
          title={!canSubmit && !isComplete ? t("actions.submitHint") : undefined}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                }}
              />
              {t("actions.submitting")}
            </span>
          ) : isComplete ? (
            t("actions.submitted")
          ) : (
            t("actions.submit")
          )}
        </button>
      </div>

      {runDisabledReason && (
        <div
          className="rounded-lg px-4 py-2.5 text-sm"
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.25)",
            color: "#fcd34d",
          }}
        >
          {runDisabledReason}
        </div>
      )}

      {xpEarned !== null && (
        <div
          className="rounded-lg px-4 py-3 text-sm font-semibold text-center"
          style={{
            background: "rgba(20,241,149,0.1)",
            border: "1px solid rgba(20,241,149,0.3)",
            color: "var(--solana-green)",
          }}
        >
          {t("xpEarned", { xp: xpEarned })}
        </div>
      )}

      {submitError && (
        <div
          className="rounded-lg px-4 py-2.5 text-sm"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#fca5a5",
          }}
        >
          {submitError}
        </div>
      )}

      {result ? (
        <div
          className="rounded-xl overflow-hidden flex-1 flex flex-col"
          style={{
            background: "var(--bg-surface)",
            border: `1px solid ${allPass ? "rgba(20,241,149,0.25)" : "var(--border-subtle)"}`,
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-elevated)",
            }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {t("results.title")}
            </span>
            <span
              className="text-sm font-bold"
              style={{
                color: allPass ? "var(--solana-green)" : "#f87171",
              }}
            >
              {t("results.passing", { passing, total })}
            </span>
          </div>

          {result.results.length === 0 ? (
            <p className="px-4 py-3 text-sm" style={{ color: "#fca5a5" }}>
              {result.error ?? t("results.none")}
            </p>
          ) : (
            <ul
              className="divide-y flex-1 overflow-y-auto"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              {result.results.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 px-4 py-3"
                  style={{
                    background: r.passed
                      ? "rgba(20,241,149,0.03)"
                      : "rgba(239,68,68,0.03)",
                  }}
                >
                  <span
                    className="shrink-0 text-sm font-bold leading-5 mt-px"
                    style={{
                      color: r.passed ? "var(--solana-green)" : "#f87171",
                    }}
                  >
                    {r.passed ? "✓" : "✗"}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="text-sm break-words"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {r.name}
                    </p>
                    {r.error && (
                      <p
                        className="text-xs mt-1 break-all font-mono"
                        style={{ color: "#fca5a5" }}
                      >
                        {r.error}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        !isRunning && (
          <div
            className="rounded-xl px-4 py-10 text-center text-sm flex-1 flex items-center justify-center"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            {t("results.runPrompt")}
          </div>
        )
      )}

      {isRunning && (
        <div
          className="rounded-xl px-4 py-10 text-center text-sm flex-1 flex flex-col items-center justify-center gap-3"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)",
          }}
        >
          <span
            className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--bg-elevated)",
              borderTopColor: "var(--solana-purple)",
            }}
          />
          <span>{t("results.runningTests")}</span>
        </div>
      )}
    </div>
  );
}
