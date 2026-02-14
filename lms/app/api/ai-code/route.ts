import { NextRequest, NextResponse } from "next/server";

const LYZR_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
const LYZR_AGENT_ID = "6990319188c3964deca09041";

export async function POST(req: NextRequest) {
  const apiKey = process.env.LYZR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { code, language, prompt, mode } = body as {
    code: string;
    language: string;
    prompt: string;
    mode: "improve" | "autofill";
  };

  if (!code || !prompt) {
    return NextResponse.json({ error: "Code and prompt are required" }, { status: 400 });
  }

  const systemMessage =
    mode === "autofill"
      ? `You are a Solana/${language} code assistant. The user has a coding challenge. Complete their code so it fulfills the challenge requirements. Return ONLY the complete working code, no explanations, no markdown fences, no extra text. Just the raw code that replaces the entire editor content.`
      : `You are a Solana/${language} code assistant. The user wants to improve their code. Refactor, fix bugs, add best practices. Return ONLY the complete improved code, no explanations, no markdown fences, no extra text. Just the raw code that replaces the entire editor content.`;

  const message = `${systemMessage}\n\nChallenge: ${prompt}\n\nCurrent code:\n${code}`;

  const sid = `code-${LYZR_AGENT_ID}-${crypto.randomUUID().slice(0, 8)}`;

  const res = await fetch(LYZR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      user_id: "code-assist@superteam.academy",
      agent_id: LYZR_AGENT_ID,
      session_id: sid,
      message,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: "AI service error", detail: text }, { status: res.status });
  }

  const data = await res.json();
  let raw = typeof data.response === "string" ? data.response : JSON.stringify(data.response);

  // Strip markdown code fences if the AI wrapped its response
  raw = raw.replace(/^```[\w]*\n?/gm, "").replace(/\n?```$/gm, "").trim();

  return NextResponse.json({ code: raw });
}
