// merge_wallet_shell_account in pglite on the real schema (every migration in
// order). The merge ends with a sweep over every public foreign key into
// profiles and auth.users, and aborts if a row still points at the shell. So a
// table the function doesn't move blocks the merge of every shell that has a
// row in it. merge-wallet-shell-execution.test.ts runs the 20260817 body on a
// stub schema and can't see tables added since.
//
// The coverage tests read the sweep's own catalog query out of the live
// function and need a row in SHELL_ROWS for every column it returns. A new
// foreign key into profiles fails here until it gets a seed row, and then
// until the function moves that row.
//
// The last describe builds the lineage without this migration and shows the
// merge aborting on each column the migration adds.
//
// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { buildFullLineage } from "./helpers/full-lineage";

const MIGRATION = "20261112130000_merge_shell_profile_fks.sql";

const SERVICE_ON = `SELECT set_config('request.jwt.claims', '{"role":"service_role"}', false);`;
const SERVICE_OFF = `SELECT set_config('request.jwt.claims', '', false);`;

const TARGET = "10000000-0000-4000-8000-000000000001";
const SHELL = "20000000-0000-4000-8000-000000000002";
const OTHER = "30000000-0000-4000-8000-000000000003";
const THIRD = "40000000-0000-4000-8000-000000000004";
const WALLET = "She11Wa11et111111111111111111111111111111111";
const CATEGORY = "50000000-0000-4000-8000-000000000005";
const OTHER_THREAD = "60000000-0000-4000-8000-000000000006";
const COHORT = "70000000-0000-4000-8000-000000000007";

// The target signed in with Google and has no wallet. The shell is the
// wallet-only account the same person made first. OTHER and THIRD are other
// learners.
const ACCOUNTS = `
  ${SERVICE_ON}
  INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data) VALUES
    ('${TARGET}', 'target@example.com', '{}', '{"provider":"google"}'),
    ('${SHELL}', '${WALLET}@wallet.superteam-lms.local', '{}', '{"provider":"email"}'),
    ('${OTHER}', 'other@example.com', '{}', '{"provider":"google"}'),
    ('${THIRD}', 'third@example.com', '{}', '{"provider":"google"}');
  UPDATE public.profiles SET username = 'target_user', is_public = true WHERE id = '${TARGET}';
  UPDATE public.profiles SET username = 'shell_user', is_public = true, wallet_address = '${WALLET}'
    WHERE id = '${SHELL}';
  UPDATE public.profiles SET username = 'other_user', is_public = true WHERE id = '${OTHER}';
  UPDATE public.profiles SET username = 'third_user', is_public = true WHERE id = '${THIRD}';

  INSERT INTO public.forum_categories (id, name, slug) VALUES ('${CATEGORY}', 'Merge test', 'merge-test');
  INSERT INTO public.threads (id, author_id, title, slug, body, type, category_id)
  VALUES ('${OTHER_THREAD}', '${OTHER}', 'Other thread', 'other-thread', 'other thread body', 'question', '${CATEGORY}');
  INSERT INTO public.league_cohorts (id, week_start, tier, member_count)
  VALUES ('${COHORT}', date_trunc('week', current_date)::date, 1, 1);
  ${SERVICE_OFF}
`;

/**
 * One row pointing at the shell for every foreign key the sweep checks, keyed
 * `table.column` as the sweep reports it.
 */
const SHELL_ROWS: Record<string, string> = {
  "admin_users.user_id": `
    INSERT INTO public.admin_users (user_id, granted_by) VALUES ('${SHELL}', 'owner');`,
  "answers.author_id": `
    INSERT INTO public.answers (thread_id, author_id, body)
    VALUES ('${OTHER_THREAD}', '${SHELL}', 'shell answer');`,
  "certificates.user_id": `
    INSERT INTO public.certificates (user_id, course_id, course_title, mint_address, tx_signature)
    VALUES ('${SHELL}', 'course-1', 'Course 1', 'mint-shell', 'cert-sig-shell');`,
  "challenge_assists.user_id": `
    INSERT INTO public.challenge_assists (user_id, lesson_id, assists_used)
    VALUES ('${SHELL}', 'lesson-1', 1);`,
  "deployed_programs.user_id": `
    INSERT INTO public.deployed_programs (user_id, course_id, lesson_id, program_id)
    VALUES ('${SHELL}', 'course-1', 'lesson-9', 'program-shell');`,
  "email_reminder_log.user_id": `
    INSERT INTO public.email_reminder_log (user_id, kind, sent_on)
    VALUES ('${SHELL}', 'session_plan', current_date);`,
  "email_subscriptions.user_id": `
    INSERT INTO public.email_subscriptions (user_id, opt_in) VALUES ('${SHELL}', true);`,
  "enrollments.user_id": `
    INSERT INTO public.enrollments (user_id, course_id, wallet_address, tx_signature)
    VALUES ('${SHELL}', 'course-1', '${WALLET}', 'enroll-sig-shell');`,
  "flags.reporter_id": `
    INSERT INTO public.flags (reporter_id, thread_id, reason)
    VALUES ('${SHELL}', '${OTHER_THREAD}', 'spam');`,
  "flags.resolved_by": `
    INSERT INTO public.flags (reporter_id, thread_id, reason, status, resolved_by, resolved_at)
    VALUES ('${THIRD}', '${OTHER_THREAD}', 'other', 'resolved', '${SHELL}', now());`,
  "league_members.user_id": `
    INSERT INTO public.league_members (cohort_id, user_id, week_start, score)
    VALUES ('${COHORT}', '${SHELL}', date_trunc('week', current_date)::date, 10);`,
  "moderation_actions.actor_id": `
    INSERT INTO public.moderation_actions (action, thread_id, actor_id)
    VALUES ('locked_thread', '${OTHER_THREAD}', '${SHELL}');`,
  "pending_onchain_actions.user_id": `
    INSERT INTO public.pending_onchain_actions (user_id, action_type, reference_id, payload)
    VALUES ('${SHELL}', 'enroll', 'course-1', '{}');`,
  "platform_spend.user_id": `
    INSERT INTO public.platform_spend (signature, action, user_id, wallet, payer, payer_role, cluster, status)
    VALUES ('spend-shell', 'complete_lesson', '${SHELL}', '${WALLET}', 'SponsorKey', 'sponsor', 'devnet', 'confirmed');`,
  "referral_events.referred_id": `
    UPDATE public.profiles SET referred_by = '${OTHER}' WHERE id = '${SHELL}';
    INSERT INTO public.referral_events (referrer_id, referred_id, kind)
    VALUES ('${OTHER}', '${SHELL}', 'signup');`,
  "referral_events.referrer_id": `
    UPDATE public.profiles SET referred_by = '${SHELL}' WHERE id = '${THIRD}';
    INSERT INTO public.referral_events (referrer_id, referred_id, kind)
    VALUES ('${SHELL}', '${THIRD}', 'signup');`,
  "review_items.user_id": `
    INSERT INTO public.review_items (user_id, item_key, box, due_at)
    VALUES ('${SHELL}', 'item-1', 1, now());`,
  "streak_freezes_used.user_id": `
    INSERT INTO public.streak_freezes_used (user_id, frozen_date) VALUES ('${SHELL}', current_date);`,
  "thread_views.user_id": `
    INSERT INTO public.thread_views (user_id, thread_id) VALUES ('${SHELL}', '${OTHER_THREAD}');`,
  "threads.author_id": `
    INSERT INTO public.threads (author_id, title, slug, body, type, category_id)
    VALUES ('${SHELL}', 'Shell thread', 'shell-thread', 'shell thread body', 'question', '${CATEGORY}');`,
  "user_achievements.user_id": `
    INSERT INTO public.user_achievements (user_id, achievement_id, asset_address, tx_signature)
    VALUES ('${SHELL}', 'first-steps', 'asset-shell', 'ach-sig-shell');`,
  "user_daily_quests.user_id": `
    INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, period_start)
    VALUES ('${SHELL}', 'q1', 1, current_date);`,
  "user_progress.user_id": `
    INSERT INTO public.user_progress (user_id, course_id, lesson_id, completed, completed_at)
    VALUES ('${SHELL}', 'course-1', 'lesson-1', true, now());`,
  // handle_new_user() creates the row with the account.
  "user_xp.user_id": `
    UPDATE public.user_xp SET total_xp = 100, level = 1 WHERE user_id = '${SHELL}';`,
  "votes.user_id": `
    INSERT INTO public.votes (user_id, thread_id, value) VALUES ('${SHELL}', '${OTHER_THREAD}', 1);`,
  "xp_transactions.user_id": `
    INSERT INTO public.xp_transactions (user_id, amount, reason, source, idempotency_key)
    VALUES ('${SHELL}', 100, 'lesson', 'lesson', 'lesson:course-1:lesson-1');`,
};

/** The columns this migration adds to the merge. */
const ADDED = [
  "admin_users.user_id",
  "moderation_actions.actor_id",
  "platform_spend.user_id",
  "referral_events.referred_id",
  "referral_events.referrer_id",
];

async function seed(pg: PGlite, sql: string): Promise<void> {
  await pg.exec(`${SERVICE_ON} ${sql} ${SERVICE_OFF}`);
}

async function merge(pg: PGlite): Promise<{ moved: Record<string, number> }> {
  const r = await pg.query<{ result: { moved: Record<string, number> } }>(
    `SELECT public.merge_wallet_shell_account($1, $2, $3) AS result`,
    [TARGET, SHELL, WALLET]
  );
  return r.rows[0]!.result;
}

async function count(
  pg: PGlite,
  sql: string,
  params: unknown[] = []
): Promise<number> {
  const r = await pg.query<{ n: string }>(sql, params);
  return Number(r.rows[0]!.n);
}

/** Rows in `table.column` that point at `id`. */
async function refs(pg: PGlite, fk: string, id: string): Promise<number> {
  const [table, column] = fk.split(".");
  return count(
    pg,
    `SELECT count(*) AS n FROM public.${table} WHERE ${column} = $1`,
    [id]
  );
}

/**
 * The `table.column` pairs the sweep checks, from the catalog query in the live
 * function body rather than a copy of it.
 */
async function sweptColumns(pg: PGlite): Promise<string[]> {
  const fn = await pg.query<{ src: string }>(
    `SELECT prosrc AS src FROM pg_proc
     WHERE oid = 'public.merge_wallet_shell_account(uuid, uuid, text)'::regprocedure`
  );
  const query = /FOR v_fk IN\s+([\s\S]+?)\s+LOOP/.exec(fn.rows[0]!.src)?.[1];
  if (!query) throw new Error("sweep query not found in the function body");
  const r = await pg.query<{ fk: string }>(
    `SELECT tbl::text || '.' || col AS fk FROM (${query}) q ORDER BY 1`
  );
  return r.rows.map((row) => row.fk);
}

async function profile(
  pg: PGlite,
  id: string
): Promise<{ referred_by: string | null; referral_code: string | null }> {
  const r = await pg.query<{
    referred_by: string | null;
    referral_code: string | null;
  }>(`SELECT referred_by, referral_code FROM public.profiles WHERE id = $1`, [
    id,
  ]);
  return r.rows[0]!;
}

/** Referral rows as `referrer>referred:kind[:course]`, sorted. */
async function referralRows(pg: PGlite): Promise<string[]> {
  const name = (id: string): string =>
    ({
      [TARGET]: "target",
      [SHELL]: "shell",
      [OTHER]: "other",
      [THIRD]: "third",
    })[id] ?? id;
  const r = await pg.query<{
    referrer_id: string;
    referred_id: string;
    kind: string;
    course_id: string | null;
  }>(
    `SELECT referrer_id, referred_id, kind, course_id FROM public.referral_events`
  );
  return r.rows
    .map(
      (row) =>
        `${name(row.referrer_id)}>${name(row.referred_id)}:${row.kind}` +
        (row.course_id ? `:${row.course_id}` : "")
    )
    .sort();
}

/** Points each referrer scores, through the same function the board reads. */
async function scored(pg: PGlite): Promise<Record<string, number>> {
  const r = await pg.query<{ referrer_id: string; n: string }>(
    `SELECT referrer_id, count(*) AS n FROM public.referral_scored_events()
     GROUP BY referrer_id`
  );
  return Object.fromEntries(
    r.rows.map((row) => [row.referrer_id, Number(row.n)])
  );
}

describe("merge_wallet_shell_account on the full lineage", () => {
  let pg: PGlite;

  beforeAll(async () => {
    pg = await buildFullLineage();
    await pg.exec(ACCOUNTS);
  }, 120_000);

  afterAll(async () => {
    await pg?.close();
  });

  beforeEach(async () => {
    await pg.exec("BEGIN");
  });

  afterEach(async () => {
    await pg.exec("ROLLBACK");
  });

  describe("coverage", () => {
    it("has a seed row for every foreign key the sweep checks", async () => {
      const swept = await sweptColumns(pg);
      expect(
        swept.filter((fk) => !(fk in SHELL_ROWS)),
        "add a row to SHELL_ROWS, then move it in merge_wallet_shell_account"
      ).toEqual([]);
      expect(
        Object.keys(SHELL_ROWS).filter((fk) => !swept.includes(fk)),
        "no longer swept: remove it from SHELL_ROWS"
      ).toEqual([]);
    });

    it("merges a shell that has a row in every swept table", async () => {
      await seed(pg, Object.values(SHELL_ROWS).join("\n"));
      const swept = await sweptColumns(pg);
      for (const fk of swept) {
        expect(await refs(pg, fk, SHELL), `${fk} seeded`).toBeGreaterThan(0);
      }

      await merge(pg);

      for (const fk of swept) {
        expect(await refs(pg, fk, SHELL), `${fk} after merge`).toBe(0);
      }
      const shell = await pg.query<{ deleted: boolean; wallet: string | null }>(
        `SELECT deleted_at IS NOT NULL AS deleted, wallet_address AS wallet
         FROM public.profiles WHERE id = $1`,
        [SHELL]
      );
      expect(shell.rows[0]).toEqual({ deleted: true, wallet: null });
    });
  });

  describe("platform_spend, moderation_actions and admin_users", () => {
    it("moves the shell's spend rows to the target and leaves the wallet as written", async () => {
      await seed(pg, SHELL_ROWS["platform_spend.user_id"]!);
      const result = await merge(pg);
      const r = await pg.query<{ user_id: string; wallet: string }>(
        `SELECT user_id, wallet FROM public.platform_spend WHERE signature = 'spend-shell'`
      );
      expect(r.rows).toEqual([{ user_id: TARGET, wallet: WALLET }]);
      expect(result.moved.platform_spend).toBe(1);
    });

    it("records the shell's moderation actions under the target", async () => {
      await seed(pg, SHELL_ROWS["moderation_actions.actor_id"]!);
      await merge(pg);
      expect(await refs(pg, "moderation_actions.actor_id", TARGET)).toBe(1);
    });

    it("ends the shell's admin grant without granting the target", async () => {
      await seed(pg, SHELL_ROWS["admin_users.user_id"]!);
      const result = await merge(pg);
      expect(
        await count(pg, `SELECT count(*) AS n FROM public.admin_users`)
      ).toBe(0);
      expect(result.moved.admin_users_dropped).toBe(1);
    });

    it("leaves the target's own admin grant as it was", async () => {
      await seed(
        pg,
        `${SHELL_ROWS["admin_users.user_id"]}
         INSERT INTO public.admin_users (user_id, granted_by) VALUES ('${TARGET}', 'target-grant');`
      );
      await merge(pg);
      const r = await pg.query<{ user_id: string; granted_by: string }>(
        `SELECT user_id, granted_by FROM public.admin_users`
      );
      expect(r.rows).toEqual([{ user_id: TARGET, granted_by: "target-grant" }]);
    });
  });

  describe("referrals", () => {
    it("drops the referral when the shell referred the target", async () => {
      await seed(
        pg,
        `UPDATE public.profiles SET referred_by = '${SHELL}' WHERE id = '${TARGET}';
         INSERT INTO public.referral_events (referrer_id, referred_id, kind)
         VALUES ('${SHELL}', '${TARGET}', 'signup');`
      );
      await merge(pg);
      expect(await referralRows(pg)).toEqual([]);
      expect((await profile(pg, TARGET)).referred_by).toBeNull();
    });

    it("drops the referral when the target referred the shell", async () => {
      await seed(
        pg,
        `UPDATE public.profiles SET referred_by = '${TARGET}' WHERE id = '${SHELL}';
         INSERT INTO public.referral_events (referrer_id, referred_id, kind, course_id) VALUES
           ('${TARGET}', '${SHELL}', 'signup', NULL),
           ('${TARGET}', '${SHELL}', 'course_completion', 'course-1');`
      );
      await merge(pg);
      expect(await referralRows(pg)).toEqual([]);
      expect((await profile(pg, TARGET)).referred_by).toBeNull();
    });

    it("carries the shell's referrer to an unreferred target and keeps that referrer's points", async () => {
      // Created after the scoring cutoff, so the signup point scores only
      // through the shell's completed lesson, which moves with the merge.
      await seed(
        pg,
        `${SHELL_ROWS["referral_events.referred_id"]}
         ${SHELL_ROWS["user_progress.user_id"]}`
      );
      expect(await scored(pg)).toEqual({ [OTHER]: 1 });

      await merge(pg);

      expect(await referralRows(pg)).toEqual(["other>target:signup"]);
      expect(await scored(pg)).toEqual({ [OTHER]: 1 });
      expect((await profile(pg, TARGET)).referred_by).toBe(OTHER);
      expect((await profile(pg, SHELL)).referred_by).toBeNull();

      // The target's next course completion credits the same referrer.
      await pg.query(
        `SELECT public.record_referral_course_completion($1, 'course-2')`,
        [TARGET]
      );
      expect(await referralRows(pg)).toEqual([
        "other>target:course_completion:course-2",
        "other>target:signup",
      ]);
    });

    it("keeps the target's referrer when both accounts were referred", async () => {
      await seed(
        pg,
        `UPDATE public.profiles SET referred_by = '${THIRD}' WHERE id = '${TARGET}';
         UPDATE public.profiles SET referred_by = '${OTHER}' WHERE id = '${SHELL}';
         INSERT INTO public.referral_events (referrer_id, referred_id, kind, course_id) VALUES
           ('${THIRD}', '${TARGET}', 'signup', NULL),
           ('${THIRD}', '${TARGET}', 'course_completion', 'course-1'),
           ('${OTHER}', '${SHELL}', 'signup', NULL),
           ('${OTHER}', '${SHELL}', 'course_completion', 'course-1'),
           ('${OTHER}', '${SHELL}', 'course_completion', 'course-2');`
      );
      await merge(pg);
      expect(await referralRows(pg)).toEqual([
        "other>target:course_completion:course-2",
        "third>target:course_completion:course-1",
        "third>target:signup",
      ]);
      expect((await profile(pg, TARGET)).referred_by).toBe(THIRD);
    });

    it("credits the shell's referrals to the target", async () => {
      await seed(pg, SHELL_ROWS["referral_events.referrer_id"]!);
      await merge(pg);
      expect(await referralRows(pg)).toEqual(["target>third:signup"]);
      expect((await profile(pg, THIRD)).referred_by).toBe(TARGET);

      await pg.query(
        `SELECT public.record_referral_course_completion($1, 'course-1')`,
        [THIRD]
      );
      expect(await referralRows(pg)).toEqual([
        "target>third:course_completion:course-1",
        "target>third:signup",
      ]);
    });

    it("moves the shell's referral code to a target without one", async () => {
      await seed(
        pg,
        `UPDATE public.profiles SET referral_code = 'aaaaaaaa' WHERE id = '${SHELL}';`
      );
      await merge(pg);
      expect((await profile(pg, TARGET)).referral_code).toBe("aaaaaaaa");
      expect((await profile(pg, SHELL)).referral_code).toBeNull();
    });

    it("drops the shell's referral code when the target has its own", async () => {
      await seed(
        pg,
        `UPDATE public.profiles SET referral_code = 'aaaaaaaa' WHERE id = '${SHELL}';
         UPDATE public.profiles SET referral_code = 'bbbbbbbb' WHERE id = '${TARGET}';`
      );
      await merge(pg);
      expect((await profile(pg, TARGET)).referral_code).toBe("bbbbbbbb");
      expect((await profile(pg, SHELL)).referral_code).toBeNull();
    });
  });
});

describe("before this migration", () => {
  let pg: PGlite;

  beforeAll(async () => {
    pg = await buildFullLineage({ except: [MIGRATION] });
    await pg.exec(ACCOUNTS);
  }, 120_000);

  afterAll(async () => {
    await pg?.close();
  });

  beforeEach(async () => {
    await pg.exec("BEGIN");
  });

  afterEach(async () => {
    await pg.exec("ROLLBACK");
  });

  it.each(ADDED)("aborts the merge of a shell with a row in %s", async (fk) => {
    await seed(pg, SHELL_ROWS[fk]!);
    await expect(merge(pg)).rejects.toThrow(`via public.${fk} `);
  });
});
