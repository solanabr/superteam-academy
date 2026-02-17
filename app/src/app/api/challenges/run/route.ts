import { NextRequest, NextResponse } from "next/server";

interface RunRequest {
  code: string;
  language: string;
  testCases: { input: string; expectedOutput: string; label: string }[];
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RunRequest;
  const { code, language, testCases } = body;

  if (!code || !testCases?.length) {
    return NextResponse.json(
      { error: "Missing code or test cases" },
      { status: 400 },
    );
  }

  if (language === "typescript") {
    const results = testCases.map((tc) => {
      try {
        const fn = new Function("input", code + "\nreturn solution(input)");
        const actual = String(fn(tc.input));
        return {
          label: tc.label,
          passed: actual.trim() === tc.expectedOutput.trim(),
          expected: tc.expectedOutput,
          actual: actual.trim(),
        };
      } catch (e) {
        return {
          label: tc.label,
          passed: false,
          expected: tc.expectedOutput,
          actual: e instanceof Error ? e.message : "Runtime error",
        };
      }
    });

    return NextResponse.json({
      results,
      allPassed: results.every((r) => r.passed),
    });
  }

  // Rust execution not supported server-side in this stub
  return NextResponse.json(
    { error: `Language "${language}" execution not supported` },
    { status: 400 },
  );
}
