import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const KEY_ERROR_HINTS = ["quota", "rate limit", "exceeded", "insufficient", "resource_exhausted"];

function parseKeys(): string[] {
  const raw = process.env.GEMINI_API_KEY || "";
  return raw
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

function getErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (err.message && typeof err.message === "string") {
      return err.message;
    }
    if (err.error && typeof err.error === "object") {
      const nested = err.error as Record<string, unknown>;
      if (nested.message && typeof nested.message === "string") {
        return nested.message;
      }
      return JSON.stringify(err.error);
    }
    return JSON.stringify(error);
  }
  
  return String(error);
}

function isQuotaError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  if (message.includes("429") || message.includes("quota") || message.includes("rate") || message.includes("resource_exhausted")) {
    return true;
  }
  return KEY_ERROR_HINTS.some((hint) => message.includes(hint));
}

function extractRetryDelay(error: unknown): number | null {
  const message = getErrorMessage(error);
  const match = message.match(/retry in (\d+(?:\.\d+)?)/i);
  return match ? Math.ceil(parseFloat(match[1])) : null;
}

function getCleanErrorMessage(error: unknown): string {
  const message = getErrorMessage(error);
  
  if (isQuotaError(error)) {
    const retryDelay = extractRetryDelay(error);
    if (retryDelay) {
      return `Rate limit exceeded. Try again in ${retryDelay}s`;
    }
    return "Rate limit exceeded. Please try again later.";
  }
  
  if (message.includes("Missing GEMINI_API_KEY") || message.includes("API_KEY")) {
    return "AI service not configured";
  }
  
  if (message.includes("404") || message.includes("not found") || message.includes("model not found")) {
    return "AI model not found";
  }
  
  if (message.includes("401") || message.includes("unauthorized") || message.includes("invalid")) {
    return "Invalid API key";
  }
  
  if (message.includes("500") || message.includes("internal") || message.includes("server error")) {
    return "AI service temporarily unavailable";
  }
  
  if (message.includes("network") || message.includes("fetch") || message.includes("connect")) {
    return "Network error. Check your connection.";
  }
  
  if (message.includes("timeout")) {
    return "Request timed out. Try again.";
  }
  
  return "Failed to get response";
}

async function generateWithFallback(input: string): Promise<string> {
  const keys = parseKeys();
  if (keys.length === 0) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  let lastError: unknown;
  for (const key of keys) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: input,
      });
      return result.text || "";
    } catch (error) {
      lastError = error;
      console.error("Gemini API error:", JSON.stringify(error, null, 2));
      if (!isQuotaError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const { error: prompt, locale } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({ explanation: "No prompt provided" }, { status: 400 });
    }

    const lang = locale === "pt-BR" ? "Portuguese (Brazilian)" : locale === "es" ? "Spanish" : "English";
    const fullPrompt = `You are a Solana/Rust developer mentor. Provide clear, concise technical explanations. 
Focus on accuracy and best practices. Don't use encouraging phrases like "keep up the good work" or repetitive sign-offs.
${prompt}

Respond in ${lang}. Keep it under 120 words.`;

    const text = await generateWithFallback(fullPrompt);
    return NextResponse.json({ explanation: text });
  } catch (e: unknown) {
    console.error("AI Mentor error:", e);
    const cleanMessage = getCleanErrorMessage(e);
    return NextResponse.json({ explanation: cleanMessage, error: true }, { status: 500 });
  }
}
