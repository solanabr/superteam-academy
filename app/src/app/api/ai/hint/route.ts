import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/solana/server/rate-limit';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MAX_HINTS_PER_CHALLENGE = 3;
const hintCounts = new Map<string, number>();

export async function POST(request: Request): Promise<NextResponse> {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({
      hint: 'AI hints require ANTHROPIC_API_KEY to be configured. Check your environment variables.',
      available: false,
    });
  }

  try {
    const body = (await request.json()) as {
      code: string;
      challenge: string;
      language: string;
      wallet: string;
    };

    if (!body.code || !body.challenge || !body.wallet) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rateCheck = checkRateLimit(body.wallet);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateCheck.retryAfter },
        { status: 429 },
      );
    }

    const key = `${body.wallet}-${body.challenge}`;
    const used = hintCounts.get(key) ?? 0;
    if (used >= MAX_HINTS_PER_CHALLENGE) {
      return NextResponse.json({
        error: `Maximum ${MAX_HINTS_PER_CHALLENGE} hints per challenge`,
        hintsRemaining: 0,
      }, { status: 429 });
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are a Solana development tutor. The student is working on this challenge:

Challenge: ${body.challenge}
Language: ${body.language}

Their current code:
\`\`\`${body.language}
${body.code.slice(0, 2000)}
\`\`\`

Give ONE short, specific hint to help them progress. Do NOT give the full solution. Focus on the concept they're missing or the next step they should take. Keep it under 3 sentences.`,
        },
      ],
    });

    const firstBlock = message.content[0];
    const hintText = firstBlock?.type === 'text' ? firstBlock.text : 'Unable to generate hint.';
    hintCounts.set(key, used + 1);

    return NextResponse.json({
      hint: hintText,
      hintsRemaining: MAX_HINTS_PER_CHALLENGE - used - 1,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate hint' }, { status: 500 });
  }
}
