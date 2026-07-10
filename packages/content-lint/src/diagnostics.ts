export type Severity = "error" | "warning" | "notice";

export interface Diagnostic {
  /** Gate identifier, e.g. "gate-1", "gate-13a". */
  gate: string;
  severity: Severity;
  /** Repo-relative path (or "" for repo-wide diagnostics). */
  file: string;
  message: string;
}

export interface LintResult {
  diagnostics: Diagnostic[];
  /** True iff there is no `error`-severity diagnostic. warnings/notices never fail. */
  ok: boolean;
}

export function diag(
  gate: string,
  severity: Severity,
  file: string,
  message: string
): Diagnostic {
  return { gate, severity, file, message };
}

export function summarize(diagnostics: Diagnostic[]): LintResult {
  return { diagnostics, ok: !diagnostics.some((d) => d.severity === "error") };
}
