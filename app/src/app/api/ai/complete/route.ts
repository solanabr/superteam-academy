import { NextRequest, NextResponse } from "next/server";
// groq-sdk provides the official Groq client. If TypeScript cannot resolve this locally,
// run `pnpm add groq-sdk` in the `app/` directory.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Groq from "groq-sdk";

type PromptPayload = {
  prompt: string;
  selection: string;
  codeBefore: string;
  codeAfter: string;
  language?: string;
};

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Groq model tuned for code-editing style prompts.
// See https://www.npmjs.com/package/groq-sdk and Groq docs for model catalog.
const MODEL = "openai/gpt-oss-20b";

function buildPrompt(opts: PromptPayload): string {
  const language = opts.language || "code";

  // This prompt follows best practices from:
  // - codemirror-ai docs (edit-in-place with selection + surrounding context)
  // - autocomplete guides (Continue, Copilot, JetBrains) favouring short, precise instructions
  // - Gemma-style FIM: treat selection as the ONLY span to overwrite, with before/after as readonly context.
  return [
    `You are an expert ${language} code editor integrated into a browser-based CodeMirror 6 editor for a Solana LMS.`,
    "",
    "TASK:",
    "You will receive:",
    "1) A natural language instruction from the user.",
    "2) The currently selected code that should be REPLACED.",
    "3) Read‑only context: code that appears BEFORE and AFTER the selection.",
    "",
    "REQUIREMENTS:",
    "- Modify ONLY the selected code span.",
    "- Preserve APIs, imports, and surrounding structure so the file still compiles.",
    "- Match the existing style (naming, formatting, comments) visible in the context.",
    "- If the selection is empty, assume you are inserting code at the cursor position.",
    "- If the request is unclear, make a reasonable, safe improvement rather than asking questions.",
    "",
    "OUTPUT FORMAT (CRITICAL):",
    "- Return EXACTLY the replacement code for the selected span.",
    "- DO NOT include backticks, language labels, diff markers, surrounding lines, or explanations.",
    "- DO NOT repeat the codeBefore or codeAfter sections.",
    "",
    "USER INSTRUCTION:",
    opts.prompt,
    "",
    "CODE BEFORE SELECTION:",
    opts.codeBefore || "<none>",
    "",
    "SELECTED CODE (TO REPLACE):",
    opts.selection || "<empty>",
    "",
    "CODE AFTER SELECTION:",
    opts.codeAfter || "<none>",
    "",
    "Return only the new code that should replace the selected span.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  let body: PromptPayload;
  try {
    body = (await request.json()) as PromptPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  const system = "You are a concise code-editing assistant. Always respond with code only.";
  const fullPrompt = buildPrompt(body);

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: fullPrompt },
      ],
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content;
    const code =
      (typeof content === "string" ? content : Array.isArray(content) ? content.map((c: any) => c?.text ?? "").join("") : "")?.trim() ??
      "";

    if (!code) {
      return NextResponse.json(
        { error: "Groq returned an empty completion", code: body.selection },
        { status: 502 }
      );
    }

    return NextResponse.json({ code });
  } catch (error: any) {
    // Do not leak sensitive details; log server-side only.
    // eslint-disable-next-line no-console
    console.error("Groq completion error:", error);
    return NextResponse.json(
      { error: "AI completion failed. Please try again later." },
      { status: 500 }
    );
  }
}

