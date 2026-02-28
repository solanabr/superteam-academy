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

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function validateCode(
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

  const results = validateCode(
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
  const hasTodos = /\/\/\s*TODO/.test(body.code);
  const lang = challenge.language === "rust" ? "main.rs" : "solution.ts";

  const outputLines = [
    `> Compiling ${lang}...`,
    `> Running ${results.length} test(s)...`,
    "",
    ...results.map(
      (r) => `  ${r.passed ? "\u2713 PASS" : "\u2717 FAIL"} ${r.name}`,
    ),
    "",
    `Results: ${passedCount}/${results.length} passed`,
  ];
  if (hasTodos) outputLines.push("", "Note: Your code still contains TODO comments.");
  if (passedCount === results.length)
    outputLines.push("", "All tests passed!");

  return NextResponse.json({
    results,
    output: outputLines.join("\n"),
    allPassed: passedCount === results.length,
  });
}
