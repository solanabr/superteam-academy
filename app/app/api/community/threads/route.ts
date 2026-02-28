import { NextRequest, NextResponse } from 'next/server';

interface Thread {
  id: string;
  title: string;
  body: string;
  author: string;
  category: string;
  upvotes: number;
  replyCount: number;
  createdAt: string;
}

// In-memory thread store
const threadStore: Thread[] = [
  {
    id: 'thread-1',
    title: 'How to optimize Solana transactions?',
    body: 'I am working on a DeFi protocol and want to minimize transaction costs. Any tips?',
    author: 'solana_dev_br',
    category: 'solana',
    upvotes: 12,
    replyCount: 5,
    createdAt: '2025-02-15T10:30:00Z',
  },
  {
    id: 'thread-2',
    title: 'Anchor vs Native: which to choose?',
    body: 'Starting a new project. What are the trade-offs between Anchor and native Solana programs?',
    author: 'rust_hacker',
    category: 'anchor',
    upvotes: 8,
    replyCount: 3,
    createdAt: '2025-02-14T14:00:00Z',
  },
  {
    id: 'thread-3',
    title: 'Best practices for NFT metadata',
    body: 'What is the recommended approach for storing NFT metadata on Solana in 2025?',
    author: 'nft_artist_sp',
    category: 'nft',
    upvotes: 6,
    replyCount: 2,
    createdAt: '2025-02-13T09:15:00Z',
  },
];

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category');
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10)));

  let threads = [...threadStore];
  if (category) {
    threads = threads.filter(t => t.category === category);
  }

  threads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = threads.length;
  const start = (page - 1) * limit;
  const paginated = threads.slice(start, start + limit);

  return NextResponse.json({
    threads: paginated,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, bodyText, author, category } = body;

  if (!title || typeof title !== 'string' || title.length < 3) {
    return NextResponse.json({ error: 'Title must be at least 3 characters' }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: 'Title must be under 200 characters' }, { status: 400 });
  }
  if (!bodyText || typeof bodyText !== 'string' || bodyText.length < 10) {
    return NextResponse.json({ error: 'Body must be at least 10 characters' }, { status: 400 });
  }
  if (bodyText.length > 10000) {
    return NextResponse.json({ error: 'Body must be under 10,000 characters' }, { status: 400 });
  }
  if (!author || typeof author !== 'string') {
    return NextResponse.json({ error: 'Author is required' }, { status: 400 });
  }

  const validCategories = ['solana', 'anchor', 'defi', 'nft', 'web3', 'general'];
  if (!validCategories.includes(category ?? 'general')) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const thread: Thread = {
    id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: title.replace(/[\x00-\x1F\x7F]/g, ''),
    body: bodyText.replace(/[\x00-\x1F\x7F]/g, ''),
    author,
    category: category ?? 'general',
    upvotes: 0,
    replyCount: 0,
    createdAt: new Date().toISOString(),
  };

  // Cap store to prevent unbounded growth
  if (threadStore.length >= 1000) threadStore.shift();
  threadStore.push(thread);

  return NextResponse.json({ thread }, { status: 201 });
}
