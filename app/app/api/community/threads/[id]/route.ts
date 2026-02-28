import { NextRequest, NextResponse } from 'next/server';

interface Reply {
  id: string;
  threadId: string;
  body: string;
  author: string;
  upvotes: number;
  createdAt: string;
}

// In-memory reply store
const replyStore = new Map<string, Reply[]>();

// Seed some replies
replyStore.set('thread-1', [
  { id: 'reply-1', threadId: 'thread-1', body: 'Use compute budget instructions to set proper limits.', author: 'web3_ana', upvotes: 4, createdAt: '2025-02-15T11:00:00Z' },
  { id: 'reply-2', threadId: 'thread-1', body: 'Also consider using priority fees during congestion.', author: 'defi_queen', upvotes: 3, createdAt: '2025-02-15T12:30:00Z' },
]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const replies = replyStore.get(id) ?? [];

  return NextResponse.json({
    threadId: id,
    replies,
    total: replies.length,
  });
}


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { bodyText, author } = body;

  if (!bodyText || typeof bodyText !== 'string' || bodyText.length < 2) {
    return NextResponse.json({ error: 'Reply body must be at least 2 characters' }, { status: 400 });
  }
  if (bodyText.length > 5000) {
    return NextResponse.json({ error: 'Reply must be under 5,000 characters' }, { status: 400 });
  }
  if (!author || typeof author !== 'string') {
    return NextResponse.json({ error: 'Author is required' }, { status: 400 });
  }

  if (!replyStore.has(id)) {
    replyStore.set(id, []);
  }
  const replies = replyStore.get(id)!;

  const reply: Reply = {
    id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId: id,
    body: bodyText.replace(/[\x00-\x1F\x7F]/g, ''),
    author: author.replace(/[\x00-\x1F\x7F]/g, ''),
    upvotes: 0,
    createdAt: new Date().toISOString(),
  };

  // Cap replies per thread
  if (replies.length >= 500) replies.shift();
  replies.push(reply);

  return NextResponse.json({ reply }, { status: 201 });
}
