import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  const { code, error, locale } = await req.json();
  const lang = locale === "pt-BR" ? "Portuguese (Brazilian)" : locale === "es" ? "Spanish" : "English";
  const prompt = "You are a friendly Solana/Rust senior developer mentor. A student got this error.\n\nCODE:\n" + code + "\n\nERROR:\n" + error + "\n\nExplain in " + lang + " what went wrong simply and give the exact fix. Be encouraging. Under 150 words.";
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return NextResponse.json({ explanation: text });
}