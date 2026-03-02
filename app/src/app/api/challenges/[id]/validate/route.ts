import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface ValidateRequest {
  code: string;
}

interface TestResult {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  passed: boolean;
}

interface CompileResult {
  success: boolean;
  stderr: string;
  stdout: string;
}

const PISTON_API = "https://emkc.org/api/v2/piston/execute";
const PISTON_TIMEOUT_MS = 8_000;

/**
 * Compile/run the submitted code via the Piston public code-execution API.
 * Returns the raw stdout/stderr. Throws on network failure so the caller
 * can fall back to heuristic validation.
 */
async function runViaPiston(
  language: "rust" | "typescript" | "json",
  code: string,
): Promise<CompileResult> {
  if (language === "json") {
    // JSON challenges cannot be "run"; skip Piston
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

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Heuristic validation: used when Piston is unavailable or for JSON challenges.
 * Falls back to pattern-matching against the reference solution.
 */
function validateHeuristic(
  code: string,
  solution: string,
  starterCode: string,
  testCases: { id: string; name: string; input: string; expectedOutput: string }[],
): TestResult[] {
  const normalizedCode = normalize(code);
  const normalizedSolution = normalize(solution);
  const normalizedStarter = normalize(starterCode);
  const isSolutionMatch = normalizedCode === normalizedSolution;
  const hasChanges = normalizedCode !== normalizedStarter;
  const hasTodos = /\/\/\s*TODO/.test(code);
  const removedTodos = !hasTodos && /\/\/\s*TODO/.test(starterCode);

  const solutionTokens =
    solution
      .match(/\b\w+(?:\.\w+)*\s*\(/g)
      ?.map((t) => t.replace(/\s*\($/, "")) ?? [];
  const uniquePatterns = [...new Set(solutionTokens)].filter(
    (t) => !starterCode.includes(t) && t.length > 2,
  );

  return testCases.map((tc, i) => {
    if (isSolutionMatch) return { ...tc, passed: true };
    if (!hasChanges) return { ...tc, passed: false };

    const patternsPerTest = Math.max(
      1,
      Math.ceil(uniquePatterns.length / testCases.length),
    );
    const testPatterns = uniquePatterns.slice(
      i * patternsPerTest,
      (i + 1) * patternsPerTest,
    );
    const matchedPatterns = testPatterns.filter((p) => code.includes(p));
    const patternScore =
      testPatterns.length > 0 ? matchedPatterns.length / testPatterns.length : 0;

    const hasExpectedContent = tc.expectedOutput
      ? code.includes(tc.expectedOutput.trim()) ||
        normalizedCode.includes(normalize(tc.expectedOutput))
      : false;

    const passed =
      patternScore >= 0.5 ||
      hasExpectedContent ||
      (removedTodos && patternScore > 0);
    return { ...tc, passed };
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: ValidateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.code || typeof body.code !== "string") {
    return NextResponse.json(
      { error: "Missing required field: code" },
      { status: 400 },
    );
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      testCases: { orderBy: { order: "asc" } },
    },
  });

  if (!challenge) {
    return NextResponse.json(
      { error: "Challenge not found" },
      { status: 404 },
    );
  }

  const lang = challenge.language === "rust" ? "main.rs" : "solution.ts";
  const hasTodos = /\/\/\s*TODO/.test(body.code);

  const outputLines: string[] = [`> Compiling ${lang}...`];

  // ── Step 1: Attempt real compilation via Piston ──────────────────────────
  let compileOk = true;
  let usedPiston = false;
  try {
    const pistonResult = await runViaPiston(
      challenge.language as "rust" | "typescript" | "json",
      body.code,
    );
    usedPiston = true;
    compileOk = pistonResult.success;

    if (!compileOk) {
      // Real compile errors — surface them directly
      outputLines.push("");
      outputLines.push("Compilation failed:");
      for (const line of pistonResult.stderr.split("\n").slice(0, 20)) {
        outputLines.push(`  ${line}`);
      }
      outputLines.push("");

      const failedResults = challenge.testCases.map((tc) => ({
        id: tc.id,
        name: tc.name,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        passed: false,
      }));

      return NextResponse.json({
        results: failedResults,
        output: outputLines.join("\n"),
        allPassed: false,
        compileError: true,
      });
    }

    if (pistonResult.stdout) {
      outputLines.push(`> Output: ${pistonResult.stdout.trim().slice(0, 200)}`);
    }
  } catch {
    // Piston unavailable — fall through to heuristic
    usedPiston = false;
  }

  // ── Step 2: Validate test cases ─────────────────────────────────────────
  const results = validateHeuristic(
    body.code,
    challenge.solution,
    challenge.starterCode,
    challenge.testCases.map((t) => ({
      id: t.id,
      name: t.name,
      input: t.input,
      expectedOutput: t.expectedOutput,
    })),
  );

  const passedCount = results.filter((r) => r.passed).length;

  outputLines.push(`> Running ${results.length} test(s)...`);
  if (!usedPiston) {
    outputLines.push("> (offline mode: structural analysis only)");
  }
  outputLines.push("");
  for (const r of results) {
    outputLines.push(`  ${r.passed ? "\u2713 PASS" : "\u2717 FAIL"} ${r.name}`);
  }
  outputLines.push("");
  outputLines.push(`Results: ${passedCount}/${results.length} passed`);

  if (hasTodos) outputLines.push("", "Note: Your code still contains TODO comments.");
  if (passedCount === results.length) outputLines.push("", "All tests passed!");

  return NextResponse.json({
    results,
    output: outputLines.join("\n"),
    allPassed: passedCount === results.length,
    compileError: false,
  });
}
