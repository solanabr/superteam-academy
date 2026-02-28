import { NextRequest, NextResponse } from 'next/server';
import { MOCK_COURSES } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim().toLowerCase();
  const locale = request.nextUrl.searchParams.get('locale') ?? 'en';
  const type = request.nextUrl.searchParams.get('type'); // 'courses' | 'challenges' | null (all)

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const results: { type: string; slug: string; title: string; description: string; score: number }[] = [];

  // Search courses
  if (!type || type === 'courses') {
    const loc = locale as 'en' | 'pt-BR' | 'es';
    for (const course of MOCK_COURSES) {
      const title = course.title[loc] ?? course.title.en;
      const desc = course.description[loc] ?? course.description.en;
      const tags = course.tags.join(' ');
      const haystack = `${title} ${desc} ${tags} ${course.track} ${course.level}`.toLowerCase();

      if (haystack.includes(q)) {
        const titleMatch = title.toLowerCase().includes(q) ? 10 : 0;
        const tagMatch = tags.toLowerCase().includes(q) ? 5 : 0;
        results.push({
          type: 'course',
          slug: course.slug,
          title,
          description: desc.slice(0, 120) + (desc.length > 120 ? '...' : ''),
          score: titleMatch + tagMatch + 1,
        });
      }
    }
  }

  // Search challenges
  if (!type || type === 'challenges') {
    const challengeNames = [
      { slug: 'keypair-gen', title: 'Generate a Keypair', tags: 'solana keypair crypto' },
      { slug: 'transfer-sol', title: 'Transfer SOL', tags: 'solana transfer lamports' },
      { slug: 'spl-token', title: 'Create SPL Token', tags: 'spl token mint' },
      { slug: 'pda-derive', title: 'Derive a PDA', tags: 'pda seeds program' },
      { slug: 'anchor-init', title: 'Anchor Initialize', tags: 'anchor program init' },
      { slug: 'nft-mint', title: 'Mint an NFT', tags: 'nft metaplex mint' },
      { slug: 'defi-swap', title: 'Token Swap', tags: 'defi swap amm' },
    ];
    for (const ch of challengeNames) {
      const haystack = `${ch.title} ${ch.tags}`.toLowerCase();
      if (haystack.includes(q)) {
        results.push({
          type: 'challenge',
          slug: ch.slug,
          title: ch.title,
          description: `Coding challenge: ${ch.title}`,
          score: ch.title.toLowerCase().includes(q) ? 10 : 3,
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    query: q,
    total: results.length,
    results: results.slice(0, 20),
  });
}
