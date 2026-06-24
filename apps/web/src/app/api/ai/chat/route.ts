import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Input caps (defense against oversized prompts / cost abuse).
const MAX_BODY_CHARS = 200_000;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_LESSON_CONTENT_CHARS = 60_000;
const MAX_LESSON_TITLE_CHARS = 300;
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_CHARS = 4_000;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const SYSTEM_PROMPT = `You are an AI tutor for Superteam Academy, a Solana blockchain learning platform. You help students understand lesson content.

Your role:
- Answer questions about the lesson content provided below
- Explain Solana and blockchain concepts in a clear, beginner-friendly way
- If the student asks about code, give concise examples
- Stay focused on the lesson topic — politely redirect off-topic questions
- Be encouraging and concise (2-4 sentences per response unless more detail is needed)
- Use markdown formatting for code blocks and emphasis

You do NOT:
- Give complete challenge solutions
- Help with anything unrelated to the lesson or Solana development
- Make up information — if unsure, say so`;

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface ChatRequestBody {
  message: string;
  history: ChatMessage[];
  lessonContent: string;
  lessonTitle: string;
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI chat not configured" },
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

  // Per-user rate limit (20 requests/min).
  if (
    isRateLimited("ai:chat", user.id, {
      maxTokens: 20,
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

  let body: ChatRequestBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { message, lessonContent, lessonTitle } = body;
  const history = Array.isArray(body.history) ? body.history : [];

  if (
    typeof message !== "string" ||
    typeof lessonContent !== "string" ||
    !message ||
    !lessonContent
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Enforce per-field input caps.
  if (
    message.length > MAX_MESSAGE_CHARS ||
    lessonContent.length > MAX_LESSON_CONTENT_CHARS ||
    (lessonTitle?.length ?? 0) > MAX_LESSON_TITLE_CHARS ||
    history.length > MAX_HISTORY_MESSAGES ||
    history.some((m) => (m?.text?.length ?? 0) > MAX_HISTORY_CHARS)
  ) {
    return NextResponse.json(
      { error: "Input exceeds maximum allowed size" },
      { status: 413 }
    );
  }

  // Build conversation history for Gemini
  const contents = [
    // First message includes system prompt + lesson context
    {
      role: "user",
      parts: [
        {
          text: `${SYSTEM_PROMPT}\n\n--- LESSON: ${lessonTitle} ---\n\n${lessonContent}\n\n--- END LESSON ---\n\nThe student will now ask questions. Remember to stay focused on this lesson content.`,
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: "Got it! I've read the lesson content and I'm ready to help. What would you like to know?",
        },
      ],
    },
    // Append chat history
    ...history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    })),
    // Current message
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini chat API error:", response.status, errorText);
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!reply) {
      return NextResponse.json(
        { error: "AI could not generate a response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
