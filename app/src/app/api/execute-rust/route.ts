import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const ipCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 10 requests per minute." },
      { status: 429 },
    );
  }

  let body: { code?: string };
  try {
    body = await req.json();
  } catch (error) {
    console.error("[execute-rust] Failed to parse request body:", error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = body.code;
  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { error: "Missing 'code' field" },
      { status: 400 },
    );
  }

  if (code.length > 50_000) {
    return NextResponse.json(
      { error: "Code too large (max 50KB)" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch("https://play.rust-lang.org/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "stable",
        mode: "debug",
        edition: "2021",
        crateType: "bin",
        tests: false,
        code,
        backtrace: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { success: false, stdout: "", stderr: `Rust Playground error: ${text}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json({
      success: data.success ?? false,
      stdout: data.stdout ?? "",
      stderr: data.stderr ?? "",
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        stdout: "",
        stderr: `Proxy error: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 502 },
    );
  }
}
