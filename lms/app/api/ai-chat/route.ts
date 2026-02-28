import { NextRequest, NextResponse } from "next/server";

const LYZR_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
const LYZR_AGENT_ID = "69a07065d48649433b1a5182";

export async function POST(req: NextRequest) {
  const apiKey = process.env.LYZR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 500 },
    );
  }

  const body = await req.json();
  const { message, sessionId, userId } = body as {
    message: string;
    sessionId?: string;
    userId?: string;
  };

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const sid =
    sessionId || `${LYZR_AGENT_ID}-${crypto.randomUUID().slice(0, 12)}`;

  const res = await fetch(LYZR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      user_id: userId || "anonymous@superteam.academy",
      agent_id: LYZR_AGENT_ID,
      session_id: sid,
      message,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "AI service error", detail: text },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json({
    response: data.response || data.message || data,
    sessionId: sid,
  });
}
