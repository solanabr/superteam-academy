import { NextRequest, NextResponse } from "next/server";

type RunCodePayload = {
  language: string;
  code: string;
  testCases?: Array<{ name?: string; input?: string; expected?: string }>;
};

/**
 * Stubbed code runner API.
 *
 * This is intentionally minimal and does NOT execute untrusted code.
 * In a future phase, this route should call a remote sandbox service
 * (e.g. Docker/Firecracker workers or a WebContainer-based runner)
 * and return real stdout/stderr and per-test results.
 */
export async function POST(request: NextRequest) {
  let body: RunCodePayload;

  try {
    body = (await request.json()) as RunCodePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.code || !body.code.trim()) {
    return NextResponse.json(
      {
        passed: false,
        stdout: "",
        stderr: "No code provided. Please write a solution before running tests.",
      },
      { status: 400 }
    );
  }

  const { language, code, testCases = [] } = body;

  // For now, fake a short delay and pretend everything passed.
  await new Promise((resolve) => setTimeout(resolve, 300));

  const summaryLines: string[] = [];
  summaryLines.push(`> language: ${language}`);
  summaryLines.push(`> code size: ${code.length} characters`);

  if (testCases.length > 0) {
    summaryLines.push(`> executing ${testCases.length} test case(s) (stubbed runner)…`);
    for (const [idx, tc] of testCases.entries()) {
      const name = tc.name ?? `case ${idx + 1}`;
      summaryLines.push(`✓ ${name} (stubbed pass)`);
    }
  } else {
    summaryLines.push("> no test cases configured for this challenge (stubbed run).");
  }

  return NextResponse.json({
    passed: true,
    stdout: summaryLines.join("\n"),
    stderr: "",
  });
}

