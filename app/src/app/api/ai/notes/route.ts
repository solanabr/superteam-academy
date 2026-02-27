import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'mock',
});

export async function POST(req: Request) {
  try {
    const { lessonContent } = await req.json();

    if (!process.env.GROQ_API_KEY) {
         return NextResponse.json({ 
            notes: "## Summary\n- Key Concept 1\n- Key Concept 2\n\nRemember to check PDAs! (Mock Data)" 
        });
    }

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are an expert tutor. Generate concise study notes."
            },
            {
                role: "user",
                content: `Generate concise study notes for this lesson content: \n${lessonContent}`
            }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 1024,
    });

    const textContent = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ notes: textContent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
