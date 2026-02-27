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
