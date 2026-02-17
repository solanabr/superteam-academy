export type ThreadCategory = 'general' | 'help' | 'show-and-tell' | 'course-discussion';

export interface Thread {
  id: string;
  title: string;
  content: string;
  category: ThreadCategory;
  authorName: string;
  authorImage: string | null;
  createdAt: string;
  replyCount: number;
  viewCount: number;
  pinned: boolean;
}

export interface Reply {
  id: string;
  threadId: string;
  content: string;
  authorName: string;
  authorImage: string | null;
  createdAt: string;
}

export interface CommunityService {
  getThreads(category?: ThreadCategory): Promise<Thread[]>;
  getThread(id: string): Promise<Thread | null>;
  getReplies(threadId: string): Promise<Reply[]>;
  createThread(thread: Omit<Thread, 'id' | 'createdAt' | 'replyCount' | 'viewCount' | 'pinned'>): Promise<Thread>;
  createReply(reply: Omit<Reply, 'id' | 'createdAt'>): Promise<Reply>;
}

const STORAGE_KEY = 'superteam-community-threads';
const REPLIES_KEY = 'superteam-community-replies';

const SEED_THREADS: Thread[] = [
  {
    id: 'thread-1',
    title: 'Welcome to Superteam Academy Community!',
    content: 'This is the official community forum. Feel free to ask questions, share your projects, and connect with fellow learners.',
    category: 'general',
    authorName: 'Superteam Team',
    authorImage: null,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    replyCount: 3,
    viewCount: 156,
    pinned: true,
  },
  {
    id: 'thread-2',
    title: 'How to set up a local Solana validator?',
    content: 'I am trying to run a local validator for development but getting errors. Can someone help?',
    category: 'help',
    authorName: 'Carlos Silva',
    authorImage: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    replyCount: 5,
    viewCount: 42,
    pinned: false,
  },
  {
    id: 'thread-3',
    title: 'My first Solana dApp - Token Swap',
    content: 'Just finished building my first token swap dApp using Anchor! Check it out and let me know what you think.',
    category: 'show-and-tell',
    authorName: 'Marina Alves',
    authorImage: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    replyCount: 8,
    viewCount: 89,
    pinned: false,
  },
  {
    id: 'thread-4',
    title: 'Solana Fundamentals - Lesson 3 Question',
    content: 'In lesson 3, when they talk about accounts, is the data field always serialized with Borsh?',
    category: 'course-discussion',
    authorName: 'Roberto Nunes',
    authorImage: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    replyCount: 2,
    viewCount: 15,
    pinned: false,
  },
];

const SEED_REPLIES: Reply[] = [
  { id: 'reply-1', threadId: 'thread-1', content: 'Excited to be here!', authorName: 'Ana Costa', authorImage: null, createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: 'reply-2', threadId: 'thread-2', content: 'Try running `solana-test-validator` after installing the Solana CLI tools.', authorName: 'Fernanda Lima', authorImage: null, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

function getThreads(): Thread[] {
  if (typeof window === 'undefined') return SEED_THREADS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_THREADS));
    return SEED_THREADS;
  }
  return JSON.parse(stored) as Thread[];
}

function saveThreads(threads: Thread[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }
}

function getAllReplies(): Reply[] {
  if (typeof window === 'undefined') return SEED_REPLIES;
  const stored = localStorage.getItem(REPLIES_KEY);
  if (!stored) {
    localStorage.setItem(REPLIES_KEY, JSON.stringify(SEED_REPLIES));
    return SEED_REPLIES;
  }
  return JSON.parse(stored) as Reply[];
}

function saveReplies(replies: Reply[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REPLIES_KEY, JSON.stringify(replies));
  }
}

export const communityService: CommunityService = {
  async getThreads(category?: ThreadCategory): Promise<Thread[]> {
    const threads = getThreads();
    const filtered = category ? threads.filter((t) => t.category === category) : threads;
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  async getThread(id: string): Promise<Thread | null> {
    const threads = getThreads();
    return threads.find((t) => t.id === id) ?? null;
  },

  async getReplies(threadId: string): Promise<Reply[]> {
    const replies = getAllReplies();
    return replies.filter((r) => r.threadId === threadId).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },

  async createThread(input): Promise<Thread> {
    const threads = getThreads();
    const thread: Thread = {
      ...input,
      id: `thread-${Date.now()}`,
      createdAt: new Date().toISOString(),
      replyCount: 0,
      viewCount: 0,
      pinned: false,
    };
    threads.unshift(thread);
    saveThreads(threads);
    return thread;
  },

  async createReply(input): Promise<Reply> {
    const replies = getAllReplies();
    const reply: Reply = {
      ...input,
      id: `reply-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    replies.push(reply);
    saveReplies(replies);

    // Update thread reply count
    const threads = getThreads();
    const thread = threads.find((t) => t.id === input.threadId);
    if (thread) {
      thread.replyCount += 1;
      saveThreads(threads);
    }

    return reply;
  },
};
