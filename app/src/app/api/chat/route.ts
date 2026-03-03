import { openai } from "@ai-sdk/openai";
import { streamText, Message } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const result = await streamText({
            model: openai("gpt-4-turbo"),
            system: `You are a helpful, expert teaching assistant for Superteam Academy Brazil. 
Your goal is to help students learn Solana, Anchor, Rust, and TypeScript development.
You are embedded in a code editor where students are solving technical challenges.

Guidelines:
- If a student shares code, give them hints, don't just give them the final answer.
- Focus on explaining *why* things work in Solana (e.g. why PDAs are used, rent exemption, CPIs).
- Be encouraging and use a friendly, professional tone.
- If asked about things completely unrelated to programming or Solana, politely steer them back to the learning platform.`,
            messages,
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response(JSON.stringify({ error: "Failed to connect to AI assistant" }), { status: 500 });
    }
}
