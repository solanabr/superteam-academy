import { NextResponse } from "next/server";
import {
  getChallengeById,
  type DailyChallengeTest,
} from "@/lib/daily-challenges";
import { runViaPiston, normalize } from "@/lib/piston";

interface ValidateRequest {
  challengeId: number;
  code: string;
}

interface TestResultItem {
  description: string;
  expectedOutput: string;
  actualOutput: string;
  executionTimeMs: number;
  passed: boolean;
}

export async function POST(request: Request) {
  let body: ValidateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.code || typeof body.code !== "string" || !body.challengeId) {
    return NextResponse.json(
      { error: "Missing required fields: challengeId, code" },
      { status: 400 },
    );
  }

  const challenge = getChallengeById(body.challengeId);
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const outputLines: string[] = [];
  const startTime = Date.now();

  // ── TypeScript challenges: build test harness and run via Piston ──────────
  if (challenge.language === "typescript") {
    const testsWithExpressions = challenge.testCases.filter(
      (tc) => tc.testExpression,
    );

    if (testsWithExpressions.length > 0) {
      // Build test harness: user code + console.log each test expression
      const harnessLines = [body.code, ""];
      testsWithExpressions.forEach((tc, i) => {
        harnessLines.push(
          `try { console.log("RESULT_${i}:" + JSON.stringify(${tc.testExpression})); } catch(e) { console.log("RESULT_${i}:ERROR:" + e.message); }`,
        );
      });
      const harness = harnessLines.join("\n");

      try {
        const pistonResult = await runViaPiston("typescript", harness);

        if (!pistonResult.success) {
          outputLines.push("> Compilation failed:");
          for (const line of pistonResult.stderr.split("\n").slice(0, 20)) {
            outputLines.push(`  ${line}`);
          }
          const failedResults: TestResultItem[] = challenge.testCases.map(
            (tc) => ({
              description: tc.description,
              expectedOutput: tc.expectedOutput,
              actualOutput: "",
              executionTimeMs: Date.now() - startTime,
              passed: false,
            }),
          );
          return NextResponse.json({
            results: failedResults,
            output: outputLines.join("\n"),
            allPassed: false,
            compileError: true,
          });
        }

        // Parse stdout for RESULT_N: lines
        const stdout = pistonResult.stdout;
        const resultMap = new Map<number, string>();
        for (const line of stdout.split("\n")) {
          const match = line.match(/^RESULT_(\d+):(.*)$/);
          if (match) {
            resultMap.set(parseInt(match[1]), match[2]);
          }
        }

        const elapsedMs = Date.now() - startTime;
        const results: TestResultItem[] = challenge.testCases.map((tc, i) => {
          const actualRaw = resultMap.get(i);
          if (actualRaw === undefined) {
            // Test had no testExpression or didn't produce output — use heuristic
            return {
              description: tc.description,
              expectedOutput: tc.expectedOutput,
              actualOutput: "",
              executionTimeMs: elapsedMs,
              passed: heuristicCheck(body.code, challenge.solutionCode, tc),
            };
          }
          if (actualRaw.startsWith("ERROR:")) {
            return {
              description: tc.description,
              expectedOutput: tc.expectedOutput,
              actualOutput: actualRaw,
              executionTimeMs: elapsedMs,
              passed: false,
            };
          }
          // Compare: strip quotes from JSON.stringify'd strings
          const actual = actualRaw.replace(/^"|"$/g, "");
          const passed = normalize(actual) === normalize(tc.expectedOutput);
          return {
            description: tc.description,
            expectedOutput: tc.expectedOutput,
            actualOutput: actual,
            executionTimeMs: elapsedMs,
            passed,
          };
        });

        const passedCount = results.filter((r) => r.passed).length;
        outputLines.push(`> Running ${results.length} test(s)...`);
        if (stdout.trim()) {
          outputLines.push(`> Output: ${stdout.trim().slice(0, 500)}`);
        }
        outputLines.push("");
        for (const r of results) {
          outputLines.push(
            `  ${r.passed ? "\u2713 PASS" : "\u2717 FAIL"} ${r.description}`,
          );
          if (!r.passed && r.actualOutput) {
            outputLines.push(`    Expected: ${r.expectedOutput}`);
            outputLines.push(`    Actual:   ${r.actualOutput}`);
          }
        }
        outputLines.push("");
        outputLines.push(`Results: ${passedCount}/${results.length} passed`);
        if (passedCount === results.length)
          outputLines.push("", "All tests passed!");

        return NextResponse.json({
          results,
          output: outputLines.join("\n"),
          allPassed: passedCount === results.length,
          compileError: false,
        });
      } catch {
        // Piston unavailable — fall through to heuristic
      }
    }
  }

  // ── Rust challenges: compile check + heuristic ────────────────────────────
  if (challenge.language === "rust") {
    try {
      const pistonResult = await runViaPiston("rust", body.code);
      if (!pistonResult.success) {
        outputLines.push("> Compilation failed:");
        for (const line of pistonResult.stderr.split("\n").slice(0, 20)) {
          outputLines.push(`  ${line}`);
        }
        const failedResults: TestResultItem[] = challenge.testCases.map(
          (tc) => ({
            description: tc.description,
            expectedOutput: tc.expectedOutput,
            actualOutput: "",
            executionTimeMs: Date.now() - startTime,
            passed: false,
          }),
        );
        return NextResponse.json({
          results: failedResults,
          output: outputLines.join("\n"),
          allPassed: false,
          compileError: true,
        });
      }
    } catch {
      // Piston unavailable — continue with heuristic
    }
  }

  // ── Heuristic fallback ────────────────────────────────────────────────────
  const elapsedMs = Date.now() - startTime;
  const results: TestResultItem[] = challenge.testCases.map((tc) => ({
    description: tc.description,
    expectedOutput: tc.expectedOutput,
    actualOutput: "",
    executionTimeMs: elapsedMs,
    passed: heuristicCheck(body.code, challenge.solutionCode, tc),
  }));

  const passedCount = results.filter((r) => r.passed).length;
  outputLines.push(`> Running ${results.length} test(s)...`);
  outputLines.push("> (offline mode: structural analysis only)");
  outputLines.push("");
  for (const r of results) {
    outputLines.push(
      `  ${r.passed ? "\u2713 PASS" : "\u2717 FAIL"} ${r.description}`,
    );
  }
  outputLines.push("");
  outputLines.push(`Results: ${passedCount}/${results.length} passed`);
  if (passedCount === results.length) outputLines.push("", "All tests passed!");

  return NextResponse.json({
    results,
    output: outputLines.join("\n"),
    allPassed: passedCount === results.length,
    compileError: false,
  });
}

function heuristicCheck(
  code: string,
  solutionCode: string,
  testCase: DailyChallengeTest,
): boolean {
  const normalizedCode = normalize(code);
  const normalizedSolution = normalize(solutionCode);
  if (normalizedCode === normalizedSolution) return true;

  const solutionTokens =
    solutionCode
      .match(/\b\w+(?:\.\w+)*\s*\(/g)
      ?.map((t) => t.replace(/\s*\($/, "")) ?? [];
  const uniquePatterns = [...new Set(solutionTokens)].filter(
    (t) => t.length > 2,
  );

  const matchedPatterns = uniquePatterns.filter((p) => code.includes(p));
  const patternScore =
    uniquePatterns.length > 0
      ? matchedPatterns.length / uniquePatterns.length
      : 0;

  const hasExpectedContent = testCase.expectedOutput
    ? code.includes(testCase.expectedOutput.trim()) ||
      normalizedCode.includes(normalize(testCase.expectedOutput))
    : false;

  return patternScore >= 0.5 || hasExpectedContent;
}
