import "server-only";
import { createRequire } from "module";

export type ThreadType = "discussion" | "question";

export interface CommunityThread {
  id: number;
  type: ThreadType;
  title: string;
  body: string;
  authorName: string;
  walletAddress: string | null;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  hasAcceptedReply: boolean;
}

export interface CommunityReply {
  id: number;
  threadId: number;
  body: string;
  authorName: string;
  walletAddress: string | null;
  isAccepted: boolean;
  createdAt: string;
}

interface PgQueryResult<T = Record<string, unknown>> {
  rows: T[];
}

interface PgPoolLike {
  query: <T = Record<string, unknown>>(
    text: string,
    values?: unknown[]
  ) => Promise<PgQueryResult<T>>;
}

interface ThreadRow {
  id: number | string;
  type: ThreadType;
  title: string;
  body: string;
  author_name: string;
  wallet_address: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  reply_count: number | string | null;
  has_accepted_reply: boolean | null;
}

interface ReplyRow {
  id: number | string;
  thread_id: number | string;
  body: string;
  author_name: string;
  wallet_address: string | null;
  is_accepted: boolean;
  created_at: Date | string;
}

const requireFromHere = createRequire(import.meta.url);

declare global {
  // eslint-disable-next-line no-var
  var __communityPgPool: PgPoolLike | undefined;
  // eslint-disable-next-line no-var
  var __communityDbInitPromise: Promise<void> | undefined;
}

function toIsoString(value: Date | string): string {
  const parsed = value instanceof Date ? value : new Date(value);
  return parsed.toISOString();
}

function normalizeThreadRow(row: ThreadRow): CommunityThread {
  return {
    id: Number(row.id),
    type: row.type,
    title: row.title,
    body: row.body,
    authorName: row.author_name,
    walletAddress: row.wallet_address,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    replyCount: Number(row.reply_count ?? 0),
    hasAcceptedReply: Boolean(row.has_accepted_reply),
  };
}

function normalizeReplyRow(row: ReplyRow): CommunityReply {
  return {
    id: Number(row.id),
    threadId: Number(row.thread_id),
    body: row.body,
    authorName: row.author_name,
    walletAddress: row.wallet_address,
    isAccepted: row.is_accepted,
    createdAt: toIsoString(row.created_at),
  };
}

function createPool(): PgPoolLike {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  let pgModule: unknown;
  try {
    pgModule = requireFromHere("pg");
  } catch {
    throw new Error(
      "Postgres driver not found. Install it with: pnpm add pg (inside app/)."
    );
  }

  const { Pool } = pgModule as {
    Pool: new (config: {
      connectionString: string;
      ssl: { rejectUnauthorized: boolean };
      max: number;
      idleTimeoutMillis: number;
      connectionTimeoutMillis: number;
    }) => PgPoolLike;
  };

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

function getPool(): PgPoolLike {
  if (!globalThis.__communityPgPool) {
    globalThis.__communityPgPool = createPool();
  }
  return globalThis.__communityPgPool;
}

async function ensureSchema(): Promise<void> {
  if (!globalThis.__communityDbInitPromise) {
    globalThis.__communityDbInitPromise = (async () => {
      const pool = getPool();

      await pool.query(`
        CREATE TABLE IF NOT EXISTS community_threads (
          id BIGSERIAL PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('discussion', 'question')),
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          author_name TEXT NOT NULL DEFAULT 'Anonymous',
          wallet_address TEXT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_community_threads_created_at
        ON community_threads (created_at DESC);
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_community_threads_type_created_at
        ON community_threads (type, created_at DESC);
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS community_replies (
          id BIGSERIAL PRIMARY KEY,
          thread_id BIGINT NOT NULL REFERENCES community_threads(id) ON DELETE CASCADE,
          body TEXT NOT NULL,
          author_name TEXT NOT NULL DEFAULT 'Anonymous',
          wallet_address TEXT NULL,
          is_accepted BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_community_replies_thread_created_at
        ON community_replies (thread_id, created_at ASC);
      `);
    })();
  }

  await globalThis.__communityDbInitPromise;
}

interface ListThreadsParams {
  type?: ThreadType;
  query?: string;
  limit: number;
  offset: number;
}

export async function listThreads(params: ListThreadsParams): Promise<CommunityThread[]> {
  await ensureSchema();
  const pool = getPool();
  const search = params.query?.trim();
  const likePattern = search ? `%${search}%` : null;

  const result = await pool.query<ThreadRow>(
    `
      SELECT
        t.id,
        t.type,
        t.title,
        t.body,
        t.author_name,
        t.wallet_address,
        t.created_at,
        t.updated_at,
        COALESCE(stats.reply_count, 0) AS reply_count,
        COALESCE(stats.has_accepted_reply, FALSE) AS has_accepted_reply
      FROM community_threads t
      LEFT JOIN (
        SELECT
          r.thread_id,
          COUNT(*)::INT AS reply_count,
          BOOL_OR(r.is_accepted) AS has_accepted_reply
        FROM community_replies r
        GROUP BY r.thread_id
      ) stats ON stats.thread_id = t.id
      WHERE
        ($1::TEXT IS NULL OR t.type = $1::TEXT)
        AND ($2::TEXT IS NULL OR t.title ILIKE $2::TEXT OR t.body ILIKE $2::TEXT)
      ORDER BY t.created_at DESC
      LIMIT $3 OFFSET $4
    `,
    [params.type ?? null, likePattern, params.limit, params.offset]
  );

  return result.rows.map(normalizeThreadRow);
}

export async function countThreads(
  type?: ThreadType,
  query?: string
): Promise<number> {
  await ensureSchema();
  const pool = getPool();
  const search = query?.trim();
  const likePattern = search ? `%${search}%` : null;

  const result = await pool.query<{ total: number | string }>(
    `
      SELECT COUNT(*)::INT AS total
      FROM community_threads t
      WHERE
        ($1::TEXT IS NULL OR t.type = $1::TEXT)
        AND ($2::TEXT IS NULL OR t.title ILIKE $2::TEXT OR t.body ILIKE $2::TEXT)
    `,
    [type ?? null, likePattern]
  );

  return Number(result.rows[0]?.total ?? 0);
}

export async function createThread(input: {
  type: ThreadType;
  title: string;
  body: string;
  authorName: string;
  walletAddress: string | null;
}): Promise<CommunityThread> {
  await ensureSchema();
  const pool = getPool();
  const created = await pool.query<ThreadRow>(
    `
      INSERT INTO community_threads (type, title, body, author_name, wallet_address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id, type, title, body, author_name, wallet_address,
        created_at, updated_at,
        0::INT AS reply_count,
        FALSE AS has_accepted_reply
    `,
    [input.type, input.title, input.body, input.authorName, input.walletAddress]
  );

  return normalizeThreadRow(created.rows[0]);
}

export async function getThreadById(id: number): Promise<CommunityThread | null> {
  await ensureSchema();
  const pool = getPool();

  const result = await pool.query<ThreadRow>(
    `
      SELECT
        t.id,
        t.type,
        t.title,
        t.body,
        t.author_name,
        t.wallet_address,
        t.created_at,
        t.updated_at,
        (
          SELECT COUNT(*)::INT
          FROM community_replies r
          WHERE r.thread_id = t.id
        ) AS reply_count,
        (
          SELECT COALESCE(BOOL_OR(r.is_accepted), FALSE)
          FROM community_replies r
          WHERE r.thread_id = t.id
        ) AS has_accepted_reply
      FROM community_threads t
      WHERE t.id = $1
      LIMIT 1
    `,
    [id]
  );

  const row = result.rows[0];
  return row ? normalizeThreadRow(row) : null;
}

export async function listReplies(threadId: number): Promise<CommunityReply[]> {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query<ReplyRow>(
    `
      SELECT
        id,
        thread_id,
        body,
        author_name,
        wallet_address,
        is_accepted,
        created_at
      FROM community_replies
      WHERE thread_id = $1
      ORDER BY created_at ASC
    `,
    [threadId]
  );

  return result.rows.map(normalizeReplyRow);
}

export async function createReply(input: {
  threadId: number;
  body: string;
  authorName: string;
  walletAddress: string | null;
}): Promise<CommunityReply> {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query<ReplyRow>(
    `
      INSERT INTO community_replies (thread_id, body, author_name, wallet_address)
      VALUES ($1, $2, $3, $4)
      RETURNING id, thread_id, body, author_name, wallet_address, is_accepted, created_at
    `,
    [input.threadId, input.body, input.authorName, input.walletAddress]
  );

  return normalizeReplyRow(result.rows[0]);
}
