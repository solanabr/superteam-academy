/**
 * Shared Piston API utility for remote code execution.
 * Used by both course challenge validation and daily challenge validation.
 */

export interface CompileResult {
  success: boolean;
  stderr: string;
  stdout: string;
}

export const PISTON_API = "https://emkc.org/api/v2/piston/execute";
export const PISTON_TIMEOUT_MS = 8_000;

/**
 * Compile/run submitted code via the Piston public code-execution API.
 * Returns the raw stdout/stderr. Throws on network failure so the caller
 * can fall back to heuristic validation.
 */
export async function runViaPiston(
  language: "rust" | "typescript" | "json",
  code: string,
): Promise<CompileResult> {
  if (language === "json") {
    return { success: true, stderr: "", stdout: "" };
  }

  const pistonLang = language === "rust" ? "rust" : "typescript";

  const response = await fetch(PISTON_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: pistonLang,
      version: "*",
      files: [{ content: code }],
      stdin: "",
      args: [],
      compile_timeout: 10_000,
      run_timeout: 3_000,
    }),
    signal: AbortSignal.timeout(PISTON_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Piston returned ${response.status}`);
  }

  const result = (await response.json()) as {
    compile?: { stderr?: string; code?: number };
    run?: { stdout?: string; stderr?: string; code?: number };
  };

  const compileStderr = result.compile?.stderr ?? "";
  const runStdout = result.run?.stdout ?? "";
  const runStderr = result.run?.stderr ?? "";
  const compileOk = !compileStderr || (result.compile?.code ?? 0) === 0;

  return {
    success: compileOk,
    stderr: compileStderr || runStderr,
    stdout: runStdout,
  };
}

export function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
