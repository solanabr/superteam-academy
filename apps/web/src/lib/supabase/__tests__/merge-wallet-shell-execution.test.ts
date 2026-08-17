// REAL SQL-execution tests for merge_wallet_shell_account (the account-fork
// auto-merge, AUTH-FLOWS.md §7), run in in-process Postgres (pglite).
//
// Two things only execution can prove, and this suite exists for both:
//
//   * The REAL `enforce_profile_wallet_write` trigger (extracted verbatim from
//     schema.sql) is installed in every test. It blocks wallet_address writes
//     from anyone but service_role — the exact failure the 2026-08-13 manual
//     merge hit — so a merge that succeeds here proves the function's
//     `set_config('request.jwt.claims', …)` genuinely satisfies it. (Plain
//     `SET ROLE` is forbidden inside SECURITY DEFINER functions; this suite
//     caught that.) Remove that set_config and the happy-path test goes red
//     on the trigger's exception.
//
//   * The fail-closed FK sweep: a table this function does not know about,
//     holding a shell row, must abort the WHOLE merge (rollback, nothing
//     half-moved) — not strand the row silently.
//
// RED-PROOF: at the pre-migration head the function does not exist and every
// test here fails on "function public.merge_wallet_shell_account does not
// exist".
//
// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

function findRepoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(resolve(dir, "supabase/schema.sql"))) {
    const parent = dirname(dir);
    if (parent === dir)
      throw new Error("repo root (supabase/schema.sql) not found");
    dir = parent;
  }
  return dir;
}

const repoRoot = findRepoRoot();
const migration = readFileSync(
  resolve(
    repoRoot,
    "supabase/migrations/20260817180000_merge_wallet_shell_account.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

/** Pull one `CREATE OR REPLACE FUNCTION <sig> … $$;` block out of schema.sql. */
function extractFunction(sql: string, signature: string): string {
  const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${signature}`);
  if (start < 0) throw new Error(`function ${signature} not found`);
  const end = sql.indexOf("$$;", start);
  if (end < 0) throw new Error(`unterminated body for ${signature}`);
  return sql.slice(start, end + 3);
}

const walletWriteTrigger = extractFunction(
  schema,
  "public.enforce_profile_wallet_write()"
);

// Stub versions of every table the merge touches, with the REAL user-facing
// keys (the UNIQUE/PK constraints the conflict policy depends on). Column sets
// are trimmed to what the function reads or the keys require; shapes mirror
// supabase/schema.sql.
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text UNIQUE);

  CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address text UNIQUE,
    google_id text UNIQUE,
    github_id text UNIQUE,
    username text UNIQUE NOT NULL,
    deleted_at timestamptz
  );

  CREATE TABLE public.user_xp (
    user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_xp integer DEFAULT 0,
    level integer DEFAULT 0,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_activity_date date,
    streak_freezes integer NOT NULL DEFAULT 0
  );
  CREATE TABLE public.xp_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount integer NOT NULL
  );
  CREATE TABLE public.enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id text NOT NULL,
    UNIQUE(user_id, course_id)
  );
  CREATE TABLE public.user_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id text NOT NULL,
    UNIQUE(user_id, lesson_id)
  );
  CREATE TABLE public.user_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id text NOT NULL,
    UNIQUE(user_id, achievement_id)
  );
  CREATE TABLE public.certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id text NOT NULL,
    UNIQUE(user_id, course_id)
  );
  CREATE TABLE public.streak_freezes_used (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    frozen_date date NOT NULL,
    PRIMARY KEY (user_id, frozen_date)
  );
  CREATE TABLE public.pending_onchain_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type text NOT NULL,
    reference_id text NOT NULL,
    UNIQUE(user_id, action_type, reference_id)
  );
  CREATE TABLE public.user_daily_quests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quest_id text NOT NULL,
    period_start date NOT NULL,
    xp integer NOT NULL DEFAULT 0,
    UNIQUE(user_id, quest_id, period_start)
  );
  CREATE TABLE public.deployed_programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id text NOT NULL,
    lesson_id text NOT NULL,
    UNIQUE(user_id, course_id, lesson_id)
  );
  CREATE TABLE public.challenge_assists (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id text NOT NULL,
    PRIMARY KEY (user_id, lesson_id)
  );
  CREATE TABLE public.review_items (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_key text NOT NULL,
    PRIMARY KEY (user_id, item_key)
  );
  CREATE TABLE public.league_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start date NOT NULL,
    UNIQUE (user_id, week_start)
  );
  CREATE TABLE public.threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
  );
  CREATE TABLE public.answers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
  );
  CREATE TABLE public.votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    thread_id uuid REFERENCES public.threads(id) ON DELETE CASCADE,
    answer_id uuid REFERENCES public.answers(id) ON DELETE CASCADE,
    value smallint NOT NULL
  );
  CREATE UNIQUE INDEX votes_user_thread_unique
    ON public.votes(user_id, thread_id) WHERE thread_id IS NOT NULL;
  CREATE UNIQUE INDEX votes_user_answer_unique
    ON public.votes(user_id, answer_id) WHERE answer_id IS NOT NULL;
  CREATE TABLE public.flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resolved_by uuid REFERENCES public.profiles(id)
  );
  CREATE TABLE public.thread_views (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, thread_id)
  );
  CREATE TABLE public.email_subscriptions (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    opt_in boolean NOT NULL DEFAULT false
  );
  CREATE TABLE public.email_reminder_log (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kind text NOT NULL,
    sent_on date NOT NULL,
    PRIMARY KEY (user_id, kind, sent_on)
  );

  GRANT USAGE ON SCHEMA public, auth TO service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
  GRANT SELECT ON auth.users TO service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO service_role;
`;

const uid = (n: number): string => {
  const c = String(n % 10);
  return `${c.repeat(8)}-${c.repeat(4)}-${c.repeat(4)}-${c.repeat(4)}-${c.repeat(12)}`;
};

const TARGET = uid(1);
const SHELL = uid(2);
const WALLET = "So1anaWa11etAddre55ForThisShe11Account";
const SHELL_EMAIL = `${WALLET}@wallet.superteam-lms.local`;

describe("merge_wallet_shell_account", () => {
  let db: PGlite;

  const seedAccounts = async (
    options: {
      shellEmail?: string;
      shellGoogleId?: string | null;
      shellDeleted?: boolean;
      targetWallet?: string | null;
    } = {}
  ): Promise<void> => {
    const {
      shellEmail = SHELL_EMAIL,
      shellGoogleId = null,
      shellDeleted = false,
      targetWallet = null,
    } = options;
    await db.query(
      `INSERT INTO auth.users(id, email) VALUES ($1, $2), ($3, $4)`,
      [TARGET, "learner@example.com", SHELL, shellEmail]
    );
    // service_role because the REAL wallet-write trigger is installed and
    // seeding a wallet is exactly the write it locks down.
    await db.exec("SET ROLE service_role;");
    await db.query(
      `INSERT INTO public.profiles(id, wallet_address, google_id, username, deleted_at)
       VALUES ($1, $2, NULL, 'real-learner', NULL),
              ($3, $4, $5, 'user_shell000', $6)`,
      [
        TARGET,
        targetWallet,
        SHELL,
        WALLET,
        shellGoogleId,
        shellDeleted ? new Date().toISOString() : null,
      ]
    );
    await db.exec("RESET ROLE;");
  };

  const merge = () =>
    db.query(`SELECT public.merge_wallet_shell_account($1, $2, $3) AS result`, [
      TARGET,
      SHELL,
      WALLET,
    ]);

  beforeEach(async () => {
    db = new PGlite();
    await db.exec(STUB_SETUP);
    await db.exec(walletWriteTrigger);
    await db.exec(`
      DROP TRIGGER IF EXISTS trg_enforce_profile_wallet_write ON public.profiles;
      CREATE TRIGGER trg_enforce_profile_wallet_write
        BEFORE INSERT OR UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.enforce_profile_wallet_write();
    `);
    await db.exec(migration);
  });

  afterEach(async () => {
    await db.close();
  });

  it("moves the wallet, folds XP, keeps target rows on conflicts, tombstones the shell", async () => {
    await seedAccounts();
    await db.exec(`
      INSERT INTO public.user_xp(user_id, total_xp, level, current_streak, longest_streak, last_activity_date, streak_freezes)
        VALUES ('${TARGET}', 100, 1, 1, 3, '2026-08-01', 1),
               ('${SHELL}', 300, 1, 5, 5, '2026-08-15', 2);
      INSERT INTO public.enrollments(user_id, course_id)
        VALUES ('${TARGET}', 'course-a'),
               ('${SHELL}', 'course-a'),
               ('${SHELL}', 'course-b');
      INSERT INTO public.xp_transactions(user_id, amount)
        VALUES ('${SHELL}', 100), ('${SHELL}', 200);
      INSERT INTO public.user_daily_quests(user_id, quest_id, period_start, xp)
        VALUES ('${TARGET}', 'q1', '2026-08-10', 25),
               ('${SHELL}', 'q1', '2026-08-10', 10),
               ('${SHELL}', 'q2', '2026-08-10', 10);
    `);

    const { rows } = await merge();
    const result = (rows[0] as { result: Record<string, unknown> }).result;
    expect(result.wallet).toBe(WALLET);

    const { rows: profiles } = await db.query(
      `SELECT id, wallet_address, deleted_at FROM public.profiles ORDER BY id`
    );
    const target = profiles.find(
      (p) => (p as { id: string }).id === TARGET
    ) as {
      wallet_address: string | null;
      deleted_at: string | null;
    };
    const shell = profiles.find((p) => (p as { id: string }).id === SHELL) as {
      wallet_address: string | null;
      deleted_at: string | null;
    };
    expect(target.wallet_address).toBe(WALLET);
    expect(target.deleted_at).toBeNull();
    expect(shell.wallet_address).toBeNull();
    expect(shell.deleted_at).not.toBeNull();

    // XP folded: 100 + 300 = 400 → level floor(sqrt(400/100)) = 2; better
    // streaks kept; freeze inventory capped at the CHECK bound of 2.
    const { rows: xp } = await db.query(
      `SELECT * FROM public.user_xp WHERE user_id = '${TARGET}'`
    );
    expect(xp).toHaveLength(1);
    const fold = xp[0] as Record<string, unknown>;
    expect(fold.total_xp).toBe(400);
    expect(fold.level).toBe(2);
    expect(fold.current_streak).toBe(5);
    expect(fold.streak_freezes).toBe(2);
    const { rows: shellXp } = await db.query(
      `SELECT 1 FROM public.user_xp WHERE user_id = '${SHELL}'`
    );
    expect(shellXp).toHaveLength(0);

    // course-a collided → target's row survived; course-b moved.
    const { rows: enrollments } = await db.query(
      `SELECT user_id, course_id FROM public.enrollments ORDER BY course_id`
    );
    expect(enrollments).toEqual([
      { user_id: TARGET, course_id: "course-a" },
      { user_id: TARGET, course_id: "course-b" },
    ]);

    // q1 collided → target's 25xp row kept (shell's 10xp dropped); q2 moved.
    const { rows: quests } = await db.query(
      `SELECT quest_id, xp FROM public.user_daily_quests WHERE user_id = '${TARGET}' ORDER BY quest_id`
    );
    expect(quests).toEqual([
      { quest_id: "q1", xp: 25 },
      { quest_id: "q2", xp: 10 },
    ]);

    // Unkeyed ledger rows all moved.
    const { rows: transactions } = await db.query(
      `SELECT count(*)::int AS n FROM public.xp_transactions WHERE user_id = '${TARGET}'`
    );
    expect((transactions[0] as { n: number }).n).toBe(2);
  });

  it("moves the shell's user_xp row whole when the target has none", async () => {
    await seedAccounts();
    await db.exec(`
      INSERT INTO public.user_xp(user_id, total_xp, level)
        VALUES ('${SHELL}', 900, 3);
    `);
    await merge();
    const { rows } = await db.query(
      `SELECT user_id, total_xp FROM public.user_xp`
    );
    expect(rows).toEqual([{ user_id: TARGET, total_xp: 900 }]);
  });

  it("refuses when the target already has a wallet", async () => {
    await seedAccounts({ targetWallet: "SomeOtherWalletAddress" });
    await expect(merge()).rejects.toThrow(/target already has a wallet/);
  });

  it("refuses when the shell email is not a synthetic wallet email", async () => {
    await seedAccounts({ shellEmail: "human@example.com" });
    await expect(merge()).rejects.toThrow(/not a synthetic wallet email/);
  });

  it("refuses when the shell has a linked OAuth identity", async () => {
    await seedAccounts({ shellGoogleId: "google-123" });
    await expect(merge()).rejects.toThrow(/linked OAuth identities/);
  });

  it("refuses when the shell is tombstoned", async () => {
    await seedAccounts({ shellDeleted: true });
    await expect(merge()).rejects.toThrow(/shell is tombstoned/);
  });

  it("refuses when the wallet does not match the shell's", async () => {
    await seedAccounts();
    await expect(
      db.query(`SELECT public.merge_wallet_shell_account($1, $2, $3)`, [
        TARGET,
        SHELL,
        "DifferentWalletEntirely",
      ])
    ).rejects.toThrow(/shell wallet does not match/);
  });

  it("aborts and rolls back everything when an unknown table still references the shell", async () => {
    await seedAccounts();
    await db.exec(`
      CREATE TABLE public.stray_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
      );
      INSERT INTO public.stray_items(user_id) VALUES ('${SHELL}');
      INSERT INTO public.enrollments(user_id, course_id) VALUES ('${SHELL}', 'course-a');
    `);

    await expect(merge()).rejects.toThrow(/stray_items/);

    // The whole transaction rolled back: wallet not moved, shell alive, its
    // enrollment untouched.
    const { rows } = await db.query(
      `SELECT id, wallet_address, deleted_at FROM public.profiles ORDER BY id`
    );
    const target = rows.find((p) => (p as { id: string }).id === TARGET) as {
      wallet_address: string | null;
    };
    const shell = rows.find((p) => (p as { id: string }).id === SHELL) as {
      wallet_address: string | null;
      deleted_at: string | null;
    };
    expect(target.wallet_address).toBeNull();
    expect(shell.wallet_address).toBe(WALLET);
    expect(shell.deleted_at).toBeNull();
    const { rows: enrollments } = await db.query(
      `SELECT user_id FROM public.enrollments`
    );
    expect(enrollments).toEqual([{ user_id: SHELL }]);
  });
});
