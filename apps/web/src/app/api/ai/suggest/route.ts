import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
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

  let body: SuggestRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { code, tests, testResults, consoleOutput, description, language } =
    body;

  if (!code || !language) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
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
