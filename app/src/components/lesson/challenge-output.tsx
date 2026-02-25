"use client";

import { useTranslations } from "next-intl";

export function ChallengeOutput({
  testResults,
  logs,
  isRunning,
  error,
}: {
  testResults: { name: string; passed: boolean; expected?: string; actual?: string }[];
  logs: string;
  isRunning: boolean;
  error?: string;
}) {
  const t = useTranslations("lesson");
  const output = error || logs;
  const allPassed = testResults.length > 0 && testResults.every((r) => r.passed);
  const anyFailed = testResults.some((r) => !r.passed);

  return (
    <div style={{ background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(255,255,255,0.04)", padding: "10px 14px", minHeight: 56, maxHeight: 140, overflowY: "auto" as const, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, whiteSpace: "pre-wrap" as const, flexShrink: 0 }}>
      {isRunning && (
        <span style={{ animation: "sa-pulse 0.8s infinite" }}>{t("running")}</span>
      )}

      {!isRunning && testResults.length > 0 && (
        <div style={{ marginBottom: output ? 6 : 0 }}>
          <span style={{ fontSize: 10, letterSpacing: "0.08em", color: allPassed ? "#14F195" : anyFailed ? "#EF4444" : "rgba(255,255,255,0.4)" }}>
            {allPassed
              ? `${t("pass")} ${testResults.length}/${testResults.length}`
              : `${testResults.filter((r) => r.passed).length}/${testResults.length} ${t("pass").toLowerCase()}`}
          </span>
          {anyFailed && testResults.filter((r) => !r.passed).map((r) => (
            <div key={r.name} style={{ fontSize: 10.5, color: "#EF4444", marginTop: 2 }}>
              {r.name}{r.expected ? ` — expected: ${r.expected}, got: ${r.actual}` : ""}
            </div>
          ))}
        </div>
      )}

      {output && !isRunning && (
        <span>
          {output.split("\n").map((line, i) => (
            <div key={i} style={{ color: line.toLowerCase().includes("error") ? "#EF4444" : line.toLowerCase().includes("success") || line.toLowerCase().includes("compiled") ? "#14F195" : "rgba(255,255,255,0.4)" }}>
              {line}
            </div>
          ))}
        </span>
      )}

      {!output && !isRunning && testResults.length === 0 && (
        <span style={{ opacity: 0.35 }}>{t("outputPlaceholder")}</span>
      )}
    </div>
  );
}
