import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { messages, context } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        console.log("AI Chat Request: Using gemini-2.0-flash");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            You are an AI assistant for Superteam Academy, an on-chain education platform.
            Your goal is to help students understand the lesson content and answer their questions.

            Lesson Context:
            ${context}

            Chat History:
            ${messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

            Please provide a helpful, concise, and technically accurate response. 
            Maintain a helpful and educational tone.
            If the question is not related to the lesson context, politely steer the conversation back to the lesson.
            Use technical terms appropriately.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ message: text });
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate response" },
            { status: 500 }
        );
    }
}
