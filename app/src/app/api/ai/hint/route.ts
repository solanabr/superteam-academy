import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'mock',
});

export async function POST(req: Request) {
  try {
    const { code, lessonContext } = await req.json();
    
    // Fallback if no key is present in env, though we expect one now.
    if (!process.env.GROQ_API_KEY) {
         return NextResponse.json({ 
            hint: "Try checking the Program ID you are using. Is it the correct one for the Devnet? (Mock Data)" 
        });
    }

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a helpful Solana coding tutor. Give a Socratic hint for the code provided without revealing the answer."
            },
            {
                role: "user",
                content: `Context: ${lessonContext}. Code: \n${code}`
            }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 500,
    });

    const textContent = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ hint: textContent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
