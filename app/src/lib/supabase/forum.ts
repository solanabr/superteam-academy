// ---------------------------------------------------------------------------
// Forum data layer — mock implementation
//
// All functions return hardcoded data. When Supabase is wired up, replace the
// internals while keeping the same signatures so the UI layer stays untouched.
// ---------------------------------------------------------------------------

export type ThreadCategory = 'general' | 'help' | 'show-and-tell' | 'ideas';

export type SortOption = 'newest' | 'most-votes' | 'most-replies';

export interface ThreadAuthor {
  wallet: string;
  level: number;
  levelTitle: string;
}

export interface Reply {
  id: string;
  threadId: string;
  body: string;
  author: ThreadAuthor;
  votes: number;
  userVote: 'up' | 'down' | null;
  createdAt: string;
}

export interface Thread {
  id: string;
  title: string;
  body: string;
  category: ThreadCategory;
  tags: string[];
  author: ThreadAuthor;
  votes: number;
  userVote: 'up' | 'down' | null;
  replyCount: number;
  viewCount: number;
  createdAt: string;
  replies: Reply[];
}

export interface ThreadFilters {
  category: ThreadCategory | null;
  search: string;
  sort: SortOption;
}

export interface CreateThreadInput {
  title: string;
  body: string;
  category: ThreadCategory;
  tags: string[];
  authorWallet: string;
}

export interface CreateReplyInput {
  body: string;
  authorWallet: string;
}

// ---------------------------------------------------------------------------
// Mock authors
// ---------------------------------------------------------------------------

const AUTHORS: ThreadAuthor[] = [
  { wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', level: 5, levelTitle: 'Architect' },
  { wallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', level: 3, levelTitle: 'Developer' },
  { wallet: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH', level: 7, levelTitle: 'Expert' },
  { wallet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', level: 1, levelTitle: 'Explorer' },
  { wallet: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', level: 9, levelTitle: 'Grandmaster' },
];

// ---------------------------------------------------------------------------
// Mock threads
// ---------------------------------------------------------------------------

const MOCK_THREADS: Thread[] = [
  {
    id: 'thread-1',
    title: 'How to properly handle transaction errors in Anchor programs?',
    body: `I've been working on my first Anchor program and I keep running into cryptic error messages when transactions fail. What's the best pattern for custom error handling in Anchor?\n\nI've tried using #[error_code] but the errors don't always propagate cleanly to the frontend. Any tips from folks who've dealt with this?`,
    category: 'help',
    tags: ['anchor', 'error-handling', 'rust'],
    author: AUTHORS[1]!,
    votes: 23,
    userVote: null,
    replyCount: 5,
    viewCount: 187,
    createdAt: '2026-02-22T14:30:00Z',
    replies: [
      {
        id: 'reply-1-1',
        threadId: 'thread-1',
        body: 'The key is to use `require!()` with your custom error enum. Make sure you derive `Error` with `#[error_code]` and the SDK will parse the error code from the transaction logs automatically.',
        author: AUTHORS[2]!,
        votes: 12,
        userVote: null,
        createdAt: '2026-02-22T15:10:00Z',
      },
      {
        id: 'reply-1-2',
        threadId: 'thread-1',
        body: 'Also check out the `anchor_lang::error::Error` type — you can pattern match on it in your tests for much cleaner assertions.',
        author: AUTHORS[0]!,
        votes: 8,
        userVote: null,
        createdAt: '2026-02-22T16:45:00Z',
      },
    ],
  },
  {
    id: 'thread-2',
    title: 'Built a token-gated dApp with Metaplex Core — here\'s what I learned',
    body: `Just finished building a token-gated community platform using Metaplex Core for the NFT membership passes. Wanted to share some lessons learned:\n\n1. Core assets are way more gas-efficient than legacy Token Metadata\n2. The plugin system is flexible but the docs are still catching up\n3. Use the Umi SDK — it handles a lot of the complexity for you\n\nHappy to answer questions about the implementation!`,
    category: 'show-and-tell',
    tags: ['metaplex', 'nft', 'dapp', 'token-gating'],
    author: AUTHORS[4]!,
    votes: 42,
    userVote: null,
    replyCount: 8,
    viewCount: 523,
    createdAt: '2026-02-21T09:15:00Z',
    replies: [
      {
        id: 'reply-2-1',
        threadId: 'thread-2',
        body: 'This is great! How did you handle the token-gating check on the frontend? Are you using DAS API or fetching directly?',
        author: AUTHORS[3]!,
        votes: 5,
        userVote: null,
        createdAt: '2026-02-21T10:00:00Z',
      },
    ],
  },
  {
    id: 'thread-3',
    title: 'Proposal: Weekly code review sessions for learners',
    body: `What if we organized weekly code review sessions where more experienced devs review code from learners going through the courses?\n\nBenefits:\n- Learners get real feedback on their code\n- Reviewers practice code review skills\n- Builds community and mentorship connections\n\nI'd be happy to help organize the first few sessions. Thoughts?`,
    category: 'ideas',
    tags: ['community', 'mentorship', 'code-review'],
    author: AUTHORS[0]!,
    votes: 31,
    userVote: null,
    replyCount: 12,
    viewCount: 289,
    createdAt: '2026-02-20T18:00:00Z',
    replies: [
      {
        id: 'reply-3-1',
        threadId: 'thread-3',
        body: 'Love this idea! Would be great to do it as live sessions on Discord with screen sharing.',
        author: AUTHORS[4]!,
        votes: 15,
        userVote: null,
        createdAt: '2026-02-20T18:30:00Z',
      },
      {
        id: 'reply-3-2',
        threadId: 'thread-3',
        body: 'Count me in as a reviewer. I have experience with Anchor and SPL token programs.',
        author: AUTHORS[2]!,
        votes: 9,
        userVote: null,
        createdAt: '2026-02-20T19:15:00Z',
      },
    ],
  },
  {
    id: 'thread-4',
    title: 'Best resources for learning Rust before diving into Solana?',
    body: `I come from a TypeScript background and want to start building on Solana. Everyone says learn Rust first but there are so many resources out there. What worked best for you?\n\nI've looked at The Rust Book, Rustlings, and some YouTube courses but would love personal recommendations from people who went through the same transition.`,
    category: 'general',
    tags: ['rust', 'beginner', 'learning-path'],
    author: AUTHORS[3]!,
    votes: 18,
    userVote: null,
    replyCount: 7,
    viewCount: 342,
    createdAt: '2026-02-19T12:00:00Z',
    replies: [
      {
        id: 'reply-4-1',
        threadId: 'thread-4',
        body: 'Rustlings is the best starting point. Do that first, then jump into Anchor without trying to master all of Rust. You\'ll learn the relevant parts of Rust through building actual programs.',
        author: AUTHORS[0]!,
        votes: 22,
        userVote: null,
        createdAt: '2026-02-19T13:00:00Z',
      },
    ],
  },
  {
    id: 'thread-5',
    title: 'Understanding PDAs — the mental model that finally clicked',
    body: `After struggling with PDAs for weeks, here's the mental model that helped me understand them:\n\nThink of a PDA like a safe deposit box at a bank. The "seeds" are the combination to open it, and the "bump" ensures the box number (address) is one that only the program can access — not a regular wallet.\n\nThe program "owns" the PDA because only it can sign for it. This is what enables programs to manage state securely.`,
    category: 'general',
    tags: ['pda', 'solana-core', 'explanation'],
    author: AUTHORS[2]!,
    votes: 56,
    userVote: null,
    replyCount: 3,
    viewCount: 891,
    createdAt: '2026-02-18T08:45:00Z',
    replies: [
      {
        id: 'reply-5-1',
        threadId: 'thread-5',
        body: 'This is the best PDA explanation I\'ve seen. The safe deposit box analogy is perfect. Sharing this with my study group.',
        author: AUTHORS[1]!,
        votes: 14,
        userVote: null,
        createdAt: '2026-02-18T09:30:00Z',
      },
    ],
  },
  {
    id: 'thread-6',
    title: 'Help: "Transaction simulation failed" but no error details',
    body: `Getting this error when trying to call my program instruction:\n\n"Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1"\n\nI've checked my account constraints and the data looks correct. The instruction worked fine in tests but fails on devnet. Anyone know how to get more detailed error info?`,
    category: 'help',
    tags: ['debugging', 'devnet', 'transactions'],
    author: AUTHORS[3]!,
    votes: 7,
    userVote: null,
    replyCount: 4,
    viewCount: 156,
    createdAt: '2026-02-23T10:20:00Z',
    replies: [
      {
        id: 'reply-6-1',
        threadId: 'thread-6',
        body: 'Error 0x1 usually means insufficient funds. Check that the fee payer has enough SOL and that any token accounts have sufficient balance.',
        author: AUTHORS[0]!,
        votes: 6,
        userVote: null,
        createdAt: '2026-02-23T11:00:00Z',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

function filterAndSortThreads(threads: Thread[], filters: ThreadFilters): Thread[] {
  let result = [...threads];

  if (filters.category) {
    result = result.filter((t) => t.category === filters.category);
  }

  if (filters.search.trim()) {
    const query = filters.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.body.toLowerCase().includes(query) ||
        t.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }

  switch (filters.sort) {
    case 'most-votes':
      result.sort((a, b) => b.votes - a.votes);
      break;
    case 'most-replies':
      result.sort((a, b) => b.replyCount - a.replyCount);
      break;
    case 'newest':
    default:
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
  }

  return result;
}

export async function getThreads(filters: ThreadFilters): Promise<Thread[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return filterAndSortThreads(MOCK_THREADS, filters);
}

export async function getThread(threadId: string): Promise<Thread | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_THREADS.find((t) => t.id === threadId) ?? null;
}

export async function createThread(input: CreateThreadInput): Promise<Thread> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const newThread: Thread = {
    id: `thread-${Date.now()}`,
    title: input.title,
    body: input.body,
    category: input.category,
    tags: input.tags,
    author: {
      wallet: input.authorWallet,
      level: 1,
      levelTitle: 'Explorer',
    },
    votes: 0,
    userVote: null,
    replyCount: 0,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    replies: [],
  };

  MOCK_THREADS.unshift(newThread);
  return newThread;
}

export async function createReply(
  threadId: string,
  input: CreateReplyInput,
): Promise<Reply> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const thread = MOCK_THREADS.find((t) => t.id === threadId);
  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`);
  }

  const newReply: Reply = {
    id: `reply-${Date.now()}`,
    threadId,
    body: input.body,
    author: {
      wallet: input.authorWallet,
      level: 1,
      levelTitle: 'Explorer',
    },
    votes: 0,
    userVote: null,
    createdAt: new Date().toISOString(),
  };

  thread.replies.push(newReply);
  thread.replyCount += 1;
  return newReply;
}

export async function voteThread(
  threadId: string,
  direction: 'up' | 'down',
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const thread = MOCK_THREADS.find((t) => t.id === threadId);
  if (!thread) throw new Error(`Thread not found: ${threadId}`);

  if (thread.userVote === direction) {
    // Un-vote
    thread.votes += direction === 'up' ? -1 : 1;
    thread.userVote = null;
  } else {
    // Reverse previous vote if any, then apply new
    if (thread.userVote === 'up') thread.votes -= 1;
    if (thread.userVote === 'down') thread.votes += 1;
    thread.votes += direction === 'up' ? 1 : -1;
    thread.userVote = direction;
  }
}

export async function voteReply(
  replyId: string,
  direction: 'up' | 'down',
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  for (const thread of MOCK_THREADS) {
    const reply = thread.replies.find((r) => r.id === replyId);
    if (reply) {
      if (reply.userVote === direction) {
        reply.votes += direction === 'up' ? -1 : 1;
        reply.userVote = null;
      } else {
        if (reply.userVote === 'up') reply.votes -= 1;
        if (reply.userVote === 'down') reply.votes += 1;
        reply.votes += direction === 'up' ? 1 : -1;
        reply.userVote = direction;
      }
      return;
    }
  }

  throw new Error(`Reply not found: ${replyId}`);
}
