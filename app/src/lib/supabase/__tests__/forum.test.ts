import { describe, it, expect, vi } from 'vitest';
import type { ThreadFilters } from '../forum';

// ---------------------------------------------------------------------------
// Read-only import — safe for filtering/sorting tests that don't mutate state
// ---------------------------------------------------------------------------
const readOnlyModule = await import('../forum');

// ---------------------------------------------------------------------------
// Helper to get a fresh module with pristine MOCK_THREADS state
// ---------------------------------------------------------------------------
async function freshForumModule() {
  vi.resetModules();
  return await import('../forum');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('forum service', () => {
  // -------------------------------------------------------------------------
  // getThreads — filtering & sorting (read-only, no mutations)
  // -------------------------------------------------------------------------

  describe('getThreads', () => {
    const defaultFilters: ThreadFilters = {
      category: null,
      search: '',
      sort: 'newest',
    };

    it('returns all threads with no filters', async () => {
      const threads = await readOnlyModule.getThreads(defaultFilters);

      expect(threads).toBeInstanceOf(Array);
      expect(threads.length).toBeGreaterThan(0);
    });

    it('filters by category', async () => {
      const threads = await readOnlyModule.getThreads({
        ...defaultFilters,
        category: 'help',
      });

      expect(threads.length).toBeGreaterThan(0);
      expect(threads.every((t) => t.category === 'help')).toBe(true);
    });

    it('filters by search query', async () => {
      const threads = await readOnlyModule.getThreads({
        ...defaultFilters,
        search: 'Anchor',
      });

      expect(threads.length).toBeGreaterThan(0);
      expect(
        threads.every(
          (t) =>
            t.title.toLowerCase().includes('anchor') ||
            t.body.toLowerCase().includes('anchor') ||
            t.tags.some((tag) => tag.toLowerCase().includes('anchor')),
        ),
      ).toBe(true);
    });

    it('sorts by newest first', async () => {
      const threads = await readOnlyModule.getThreads({
        ...defaultFilters,
        sort: 'newest',
      });

      for (let i = 1; i < threads.length; i++) {
        const prev = new Date(threads[i - 1]!.createdAt).getTime();
        const curr = new Date(threads[i]!.createdAt).getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it('sorts by most votes', async () => {
      const threads = await readOnlyModule.getThreads({
        ...defaultFilters,
        sort: 'most-votes',
      });

      for (let i = 1; i < threads.length; i++) {
        expect(threads[i - 1]!.votes).toBeGreaterThanOrEqual(threads[i]!.votes);
      }
    });

    it('sorts by most replies', async () => {
      const threads = await readOnlyModule.getThreads({
        ...defaultFilters,
        sort: 'most-replies',
      });

      for (let i = 1; i < threads.length; i++) {
        expect(threads[i - 1]!.replyCount).toBeGreaterThanOrEqual(
          threads[i]!.replyCount,
        );
      }
    });
  });

  // -------------------------------------------------------------------------
  // getThread
  // -------------------------------------------------------------------------

  describe('getThread', () => {
    it('returns thread by ID', async () => {
      const thread = await readOnlyModule.getThread('thread-1');

      expect(thread).not.toBeNull();
      expect(thread!.id).toBe('thread-1');
      expect(thread!.title).toBeDefined();
      expect(thread!.replies).toBeInstanceOf(Array);
    });

    it('returns null for unknown ID', async () => {
      const thread = await readOnlyModule.getThread('thread-nonexistent');

      expect(thread).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // createThread (mutates MOCK_THREADS — use fresh module)
  // -------------------------------------------------------------------------

  describe('createThread', () => {
    it('creates new thread with correct fields', async () => {
      const forum = await freshForumModule();

      const thread = await forum.createThread({
        title: 'Test thread',
        body: 'Test body content',
        category: 'general',
        tags: ['test'],
        authorWallet: 'TestWallet123',
      });

      expect(thread.id).toMatch(/^thread-/);
      expect(thread.title).toBe('Test thread');
      expect(thread.body).toBe('Test body content');
      expect(thread.category).toBe('general');
      expect(thread.tags).toEqual(['test']);
      expect(thread.author.wallet).toBe('TestWallet123');
      expect(thread.votes).toBe(0);
      expect(thread.replyCount).toBe(0);
      expect(thread.replies).toEqual([]);
      expect(thread.createdAt).toBeDefined();
    });

    it('new thread appears in getThreads results', async () => {
      const forum = await freshForumModule();

      const created = await forum.createThread({
        title: 'Findable thread',
        body: 'Should appear in results',
        category: 'ideas',
        tags: [],
        authorWallet: 'Wallet456',
      });

      const threads = await forum.getThreads({
        category: null,
        search: '',
        sort: 'newest',
      });

      expect(threads.some((t) => t.id === created.id)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // voteThread (mutates MOCK_THREADS — use fresh module)
  // -------------------------------------------------------------------------

  describe('voteThread', () => {
    it('increments vote count on upvote', async () => {
      const forum = await freshForumModule();

      const before = await forum.getThread('thread-1');
      const votesBefore = before!.votes;

      await forum.voteThread('thread-1', 'up');

      const after = await forum.getThread('thread-1');
      expect(after!.votes).toBe(votesBefore + 1);
    });

    it('throws for unknown threadId', async () => {
      const forum = await freshForumModule();

      await expect(
        forum.voteThread('thread-nonexistent', 'up'),
      ).rejects.toThrow('Thread not found: thread-nonexistent');
    });
  });

  // -------------------------------------------------------------------------
  // createReply (mutates MOCK_THREADS — use fresh module)
  // -------------------------------------------------------------------------

  describe('createReply', () => {
    it('adds reply to thread and increments replyCount', async () => {
      const forum = await freshForumModule();

      const before = await forum.getThread('thread-1');
      const replyCountBefore = before!.replyCount;
      const repliesBefore = before!.replies.length;

      const reply = await forum.createReply('thread-1', {
        body: 'Great discussion!',
        authorWallet: 'ReplyWallet789',
      });

      expect(reply.id).toMatch(/^reply-/);
      expect(reply.threadId).toBe('thread-1');
      expect(reply.body).toBe('Great discussion!');
      expect(reply.author.wallet).toBe('ReplyWallet789');

      const after = await forum.getThread('thread-1');
      expect(after!.replyCount).toBe(replyCountBefore + 1);
      expect(after!.replies.length).toBe(repliesBefore + 1);
    });

    it('throws for unknown threadId', async () => {
      const forum = await freshForumModule();

      await expect(
        forum.createReply('thread-nonexistent', {
          body: 'Orphan reply',
          authorWallet: 'Wallet000',
        }),
      ).rejects.toThrow('Thread not found: thread-nonexistent');
    });
  });
});
