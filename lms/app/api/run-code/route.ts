import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code, language, testCases } = await request.json();

  // Stub: simulate code execution
  const results = (testCases ?? []).map((tc: { id: string; name: string }) => ({
    id: tc.id,
    name: tc.name,
    passed: code && code.length > 20,
    output: code && code.length > 20 ? "Test passed" : "Code too short",
  }));

  return NextResponse.json({
    success: results.every((r: { passed: boolean }) => r.passed),
    results,
    executionTime: Math.floor(Math.random() * 500) + 100,
  });
}
