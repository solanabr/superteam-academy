import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'mock',
});

export async function POST(req: Request) {
  try {
    const { code, lessonContext } = await req.json();

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ 
            message: "This code looks good! You've correctly implemented the instruction. One suggestion: consider handling potential errors. (Mock Data)" 
        });
    }

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are an expert Solana developer. keyReview this code concisely."
            },
            {
                role: "user",
                content: `Review this Solana code in the context of ${lessonContext}. Be concise and helpful. Code: \n${code}`
            }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 1024,
    });

    const textContent = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ message: textContent });
  } catch (error) {
     console.error(error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
