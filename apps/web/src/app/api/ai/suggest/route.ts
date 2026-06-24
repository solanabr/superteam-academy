import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Input caps (defense against oversized prompts / cost abuse).
const MAX_BODY_CHARS = 120_000;
const MAX_CODE_CHARS = 20_000;
const MAX_DESCRIPTION_CHARS = 5_000;
const MAX_CONSOLE_CHARS = 10_000;
const MAX_TEST_ITEMS = 50;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const SYSTEM_PROMPT = `You are a coding tutor for a Solana blockchain learning platform. A student is working on a coding challenge and needs help.

Your role:
- Generate the FULL working code for the challenge with detailed inline comments explaining each step
- Comments should teach the student WHY each line is needed, not just WHAT it does
- Use the student's existing code structure as a starting point — keep their imports and function signatures
- Add step-by-step // comments before key lines explaining the reasoning
- The code MUST pass all the provided test cases

Comment style:
- Use // comments (not block comments)
- Be concise but educational (e.g. "// Generate a new keypair — this creates a random Ed25519 key pair")
- Explain concepts relevant to Solana/blockchain when applicable
- Number the steps if there's a clear sequence (e.g. "// Step 1: ...", "// Step 2: ...")

Respond with ONLY the code. No JSON wrapping, no markdown fences, no explanation — just the raw code with comments.`;

interface SuggestRequestBody {
  code: string;
  tests: { description: string; input: string; expectedOutput: string }[];
  testResults: { passed: boolean; description: string; actual: string }[];
  consoleOutput: string;
  description: string;
  language: string;
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI suggestions not configured" },
      { status: 503 }
    );
  }

  // Require an authenticated user.
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Per-user rate limit (10 requests/min — heavier generation than chat).
  if (
    isRateLimited("ai:suggest", user.id, {
      maxTokens: 10,
      refillIntervalMs: 60_000,
    })
  ) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before trying again." },
      { status: 429 }
    );
  }

  // Cap the raw body before parsing to reject oversized payloads.
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  let body: SuggestRequestBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { code, tests, testResults, consoleOutput, description, language } =
    body;

  if (
    typeof code !== "string" ||
    typeof language !== "string" ||
    !code ||
    !language
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Enforce per-field input caps.
  if (
    code.length > MAX_CODE_CHARS ||
    (description?.length ?? 0) > MAX_DESCRIPTION_CHARS ||
    (consoleOutput?.length ?? 0) > MAX_CONSOLE_CHARS ||
    (tests?.length ?? 0) > MAX_TEST_ITEMS ||
    (testResults?.length ?? 0) > MAX_TEST_ITEMS
  ) {
    return NextResponse.json(
      { error: "Input exceeds maximum allowed size" },
      { status: 413 }
    );
  }

  const failedTests = testResults?.filter((r) => !r.passed) ?? [];

  const userPrompt = `Language: ${language}

Challenge description:
${description ?? "N/A"}

Student's code:
\`\`\`${language}
${code}
\`\`\`

Test results (${failedTests.length} failed out of ${testResults?.length ?? 0}):
${failedTests.map((r) => `- FAILED: ${r.description} (got: ${r.actual})`).join("\n") || "No failures"}

Console/error output:
${consoleOutput || "None"}

Test cases:
${tests?.map((t) => `- ${t.description}: input=${t.input}, expected=${t.expectedOutput}`).join("\n") || "None"}`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip markdown fences if Gemini wraps the code in them
    const generatedCode = rawText
      .replace(/^```[\w]*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .trim();

    if (!generatedCode) {
      return NextResponse.json(
        { error: "AI could not generate code" },
        { status: 502 }
      );
    }

    return NextResponse.json({ code: generatedCode });
  } catch (error) {
    console.error("AI suggest error:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
