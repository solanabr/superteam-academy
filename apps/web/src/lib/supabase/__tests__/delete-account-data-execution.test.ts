// The real delete_account_data RPC in pglite, on the real schema: every migration
// in order, real triggers and constraints. Two accounts carry the same data; the
// RPC runs on one, and the other must not change at all.
//
// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DELETION_POLICY } from "@/lib/account/deletion-policy";
import { recoveredCompletedAt } from "@/lib/lessons/recovered-completion";
import { sponsorshipWalletKeys } from "@/lib/platform-spend/wallet-keys";
import { buildFullLineage, findRepoRoot } from "./helpers/full-lineage";

const VICTIM = "11111111-1111-4111-8111-111111111111";
const BYSTANDER = "22222222-2222-4222-8222-222222222222";
const V_WALLET = "VictimWa11et1111111111111111111111111111111";
const B_WALLET = "BystanderWa11et222222222222222222222222222";
const V_EMAIL = "victim-private@example.com";
const NIL_ACTOR = "00000000-0000-0000-0000-000000000000";
const V_USERNAME = "victim_username";
const V_DISPLAY = "victim Display Name";
const V_IP = "203.0.113.77";
const V_CHAT = "victim private chat text";
const V_FLAG = "victim flag free text";
const V_META_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const V_WALLET_META_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const B_META_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const V_THREAD = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const B_THREAD = "abababab-abab-4bab-8bab-abababababab";
const V_ANSWER = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const CATEGORY = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const GOOGLE_SUB = "google-subject-of-victim";

const SERVICE_ON = `SELECT set_config('request.jwt.claims', '{"role":"service_role"}', false);`;
const SERVICE_OFF = `SELECT set_config('request.jwt.claims', '', false);`;

function perAccount(
  id: string,
  wallet: string,
  email: string,
  username: string,
  metaId: string,
  tag: "victim" | "bystander"
): string {
  const ip = tag === "victim" ? V_IP : "198.51.100.9";
  const phone = tag === "victim" ? "+5511900000001" : "+5511900000002";
  return `
  INSERT INTO auth.users (id, email, phone, encrypted_password, email_change,
                          confirmation_token, recovery_token, email_change_token_new,
                          raw_user_meta_data, raw_app_meta_data)
  VALUES ('${id}', '${email}', '${phone}', 'hash', '${tag}-new@example.com',
          'conf${tag}', 'rec${tag}', 'new${tag}',
          '{"wallet_address":"${wallet}","full_name":"${tag} Full Name","avatar_url":"https://cdn.example.com/${tag}.png"}',
          '{"provider":"google","providers":["google"]}');
  INSERT INTO auth.identities (user_id, provider, provider_id, identity_data)
  VALUES ('${id}', 'google', 'google-subject-of-${tag}', '{"email":"${email}"}');
  INSERT INTO auth.sessions (id, user_id, user_agent, ip)
  VALUES ('${id}', '${id}', '${tag} agent', '198.51.100.1');
  INSERT INTO auth.refresh_tokens (token, user_id, session_id) VALUES ('tok${tag}', '${id}', '${id}');
  INSERT INTO auth.one_time_tokens (user_id, token_hash, relates_to) VALUES ('${id}', 'h${tag}', '${email}');
  INSERT INTO auth.flow_state (user_id, provider_access_token) VALUES ('${id}', 'pat${tag}');
  INSERT INTO auth.mfa_factors (user_id, phone) VALUES ('${id}', '${phone}');
  INSERT INTO auth.audit_log_entries (payload, ip_address)
  VALUES (json_build_object('actor_id', '${id}', 'actor_username', '${email}'), '${ip}'),
         (json_build_object('actor_id', '${NIL_ACTOR}', 'actor_username', 'service_role',
            'action', 'user_modified',
            'traits', json_build_object('user_id', '${id}', 'user_email', '${email}', 'user_phone', '${phone}')), '10.0.0.1'),
         (json_build_object('actor_id', '${NIL_ACTOR}', 'actor_username', 'service_role',
            'action', 'user_invited',
            'traits', json_build_object('user_email', '${email}')), '10.0.0.1');

  UPDATE public.profiles SET
    username = '${username}', display_name = '${tag} Display Name', bio = '${tag} bio',
    avatar_url = 'https://cdn.example.com/${tag}.png',
    social_links = '{"x":"${tag}_handle"}', wallet_address = '${wallet}', wallet_kind = 'external',
    google_id = 'g-${tag}', github_id = 'gh-${tag}', is_public = true,
    segment = 1, goal = 'build', daily_goal = 10,
    prefs = '{"nextLesson":{"days":["mon"],"time":"19:00"}}',
    referral_code = '${tag === "victim" ? "aaaaaaaa" : "bbbbbbbb"}',
    wallet_xp_synced_at = now(), verified = true, verified_kind = 'partner'
  WHERE id = '${id}';

  INSERT INTO public.enrollments (user_id, course_id, wallet_address, tx_signature)
  VALUES ('${id}', 'course-1', '${wallet}', 'enroll-sig-${tag}');
  INSERT INTO public.user_progress (user_id, course_id, lesson_id, completed, tx_signature)
  VALUES ('${id}', 'course-1', 'lesson-1', true, 'lesson-sig-${tag}');
  UPDATE public.user_xp SET total_xp = 500, level = 2, longest_streak = 3 WHERE user_id = '${id}';
  INSERT INTO public.xp_transactions (user_id, amount, reason, source, idempotency_key, tx_signature)
  VALUES ('${id}', 500, 'lesson', 'lesson', 'lesson:course-1:lesson-1', 'xp-sig-${tag}');
  INSERT INTO public.user_achievements (user_id, achievement_id, asset_address, tx_signature)
  VALUES ('${id}', 'first-steps', 'asset-${tag}', 'ach-sig-${tag}');
  INSERT INTO public.nft_metadata (id, data) VALUES ('${metaId}',
    jsonb_build_object('name', 'Credential', 'attributes', jsonb_build_array(
      jsonb_build_object('trait_type', 'Course', 'value', 'Course 1'),
      jsonb_build_object('trait_type', 'Recipient', 'value', '${username}'),
      jsonb_build_object('trait_type', 'Course Version', 'value', 3))));
  INSERT INTO public.certificates (user_id, course_id, course_title, mint_address, metadata_uri, tx_signature)
  VALUES ('${id}', 'course-1', 'Course 1', 'mint-${tag}',
          'https://www.st.academy/api/certificates/metadata?id=${metaId}', 'cert-sig-${tag}');
  INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, period_start)
  VALUES ('${id}', 'q1', 1, current_date);
  INSERT INTO public.streak_freezes_used (user_id, frozen_date) VALUES ('${id}', current_date);
  INSERT INTO public.deployed_programs (user_id, course_id, lesson_id, program_id, network)
  VALUES ('${id}', 'course-1', 'lesson-9', 'program-${tag}', 'devnet');
  INSERT INTO public.challenge_assists (user_id, lesson_id, assists_used, chat_log)
  VALUES ('${id}', 'lesson-1', 4, jsonb_build_array(jsonb_build_object('text', '${tag} private chat text')));
  INSERT INTO public.review_items (user_id, item_key, box, due_at) VALUES ('${id}', 'item-1', 1, now());
  INSERT INTO public.email_subscriptions (user_id, opt_in, consent_at, reminder_opt_in, reminder_consent_at, reminder_locale)
  VALUES ('${id}', true, now(), true, now(), 'pt-BR');
  INSERT INTO public.email_reminder_log (user_id, kind, sent_on) VALUES ('${id}', 'session_plan', current_date);
  INSERT INTO public.admin_users (user_id, granted_by) VALUES ('${id}', 'owner');
  INSERT INTO public.rate_limits (key, window_start) VALUES ('account-delete:${id}', now());
  INSERT INTO public.ai_spend_ledger (scope, scope_key, spend_day, micro_usd, request_count)
  VALUES ('account', '${id}', current_date, 50, 1);
  INSERT INTO public.siws_nonces (nonce, status, wallet_address, ip_address, consumed_at)
  VALUES ('nonce-${tag}', 'consumed', '${wallet}', '${ip}', now());
  INSERT INTO public.pending_onchain_actions (user_id, action_type, reference_id, payload, last_error)
  VALUES ('${id}', 'enroll', 'course-1', jsonb_build_object('walletAddress', '${wallet}', 'courseId', 'course-1'), 'failed for ${wallet}');
  INSERT INTO public.platform_spend (signature, action, user_id, wallet, payer, payer_role, cluster, status)
  VALUES ('spend-${tag}', 'complete_lesson', '${id}', '${wallet}', 'SponsorKey', 'sponsor', 'devnet', 'confirmed');
  INSERT INTO public.platform_spend (signature, action, user_id, wallet, course_id, program_id, course_generation,
                                     payer, payer_role, cluster, status)
  VALUES ('sponsor-${tag}', 'enroll_sponsor', '${id}', '${wallet}', 'course-1', 'prog', 1,
          'SponsorKey', 'sponsor', 'devnet', 'confirmed');
  `;
}

const SEED = `
  ${SERVICE_ON}
  ${perAccount(VICTIM, V_WALLET, V_EMAIL, V_USERNAME, V_META_ID, "victim")}
  ${perAccount(BYSTANDER, B_WALLET, "bystander@example.com", "bystander_username", B_META_ID, "bystander")}
  UPDATE public.profiles SET referred_by = '${BYSTANDER}' WHERE id = '${VICTIM}';

  INSERT INTO public.nft_metadata (id, data) VALUES ('${V_WALLET_META_ID}',
    jsonb_build_object('attributes', jsonb_build_array(
      jsonb_build_object('trait_type', 'Recipient', 'value', '${V_WALLET}'))));

  INSERT INTO public.forum_categories (id, name, slug) VALUES ('${CATEGORY}', 'Test category', 'test-category');
  INSERT INTO public.threads (id, author_id, title, slug, body, type, category_id)
  VALUES ('${V_THREAD}', '${VICTIM}', 'A thread', 'a-thread', 'thread body stays', 'question', '${CATEGORY}');
  INSERT INTO public.answers (id, thread_id, author_id, body) VALUES ('${V_ANSWER}', '${V_THREAD}', '${VICTIM}', 'answer body stays');
  INSERT INTO public.threads (id, author_id, title, slug, body, type, category_id)
  VALUES ('${B_THREAD}', '${BYSTANDER}', 'Other thread', 'other-thread', 'other body', 'question', '${CATEGORY}');
  INSERT INTO public.votes (user_id, thread_id, value) VALUES ('${VICTIM}', '${B_THREAD}', 1);
  INSERT INTO public.votes (user_id, thread_id, value) VALUES ('${BYSTANDER}', '${V_THREAD}', 1);
  INSERT INTO public.thread_views (user_id, thread_id) VALUES ('${VICTIM}', '${V_THREAD}');
  INSERT INTO public.thread_views (user_id, thread_id) VALUES ('${BYSTANDER}', '${V_THREAD}');
  INSERT INTO public.flags (reporter_id, thread_id, reason, details) VALUES ('${VICTIM}', '${B_THREAD}', 'other', '${V_FLAG}');
  INSERT INTO public.flags (reporter_id, thread_id, reason, details) VALUES ('${BYSTANDER}', '${V_THREAD}', 'other', 'bystander flag text');
  INSERT INTO public.moderation_actions (action, thread_id, actor_id) VALUES ('locked_thread', '${V_THREAD}', '${BYSTANDER}');

  INSERT INTO public.referral_seasons (number, starts_at, ends_at) VALUES (99, now() - interval '1 day', now() + interval '30 days');
  INSERT INTO public.referral_events (referrer_id, referred_id, kind) VALUES ('${BYSTANDER}', '${VICTIM}', 'signup');

  INSERT INTO public.league_cohorts (id, week_start, tier, member_count)
  VALUES ('99999999-9999-4999-8999-999999999999', date_trunc('week', current_date)::date, 1, 2);
  INSERT INTO public.league_members (cohort_id, user_id, week_start, score)
  VALUES ('99999999-9999-4999-8999-999999999999', '${VICTIM}', date_trunc('week', current_date)::date, 10),
         ('99999999-9999-4999-8999-999999999999', '${BYSTANDER}', date_trunc('week', current_date)::date, 20);
  ${SERVICE_OFF}
`;

/** Every row of a table as text, in a stable order. */
async function dump(db: PGlite, qualified: string): Promise<string[]> {
  const { rows } = await db.query<{ r: string }>(
    `SELECT to_jsonb(t)::text AS r FROM ${qualified} t ORDER BY 1`
  );
  return rows.map((row) => row.r);
}

async function publicTables(db: PGlite): Promise<string[]> {
  const { rows } = await db.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY 1`
  );
  return rows.map((r) => r.table_name);
}

const AUTH_TABLES = [
  "users",
  "identities",
  "sessions",
  "refresh_tokens",
  "one_time_tokens",
  "flow_state",
  "mfa_factors",
  "audit_log_entries",
];

const run = (db: PGlite, id: string) =>
  db.query("SELECT public.delete_account_data($1)", [id]);

describe("delete_account_data", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await buildFullLineage();
    await db.exec(`
      CREATE TABLE auth.future_user_table (user_id uuid);
      INSERT INTO auth.future_user_table VALUES ('${VICTIM}'), ('${BYSTANDER}');
    `);
    await db.exec(SEED);
    // The name the RPC would have used if it were derived from the id: someone
    // holding it must not be able to block this account's deletion.
    await db.exec(`
      ${SERVICE_ON}
      UPDATE public.profiles
      SET username = 'deleted-user-${createHash("md5").update(VICTIM).digest("hex").slice(0, 12)}'
      WHERE id = '${BYSTANDER}';
      ${SERVICE_OFF}
    `);
    await db.exec("CREATE SCHEMA snapshot;");
    for (const table of await publicTables(db)) {
      await db.exec(
        `CREATE TABLE snapshot.${table} AS SELECT * FROM public.${table};`
      );
    }
    await run(db, VICTIM);
  }, 180_000);
  afterAll(async () => {
    await db.close();
  });

  describe("no identifying value survives", () => {
    const markers = [
      V_EMAIL,
      "victim-new@example.com",
      V_WALLET,
      V_USERNAME,
      V_DISPLAY,
      V_IP,
      V_CHAT,
      V_FLAG,
      GOOGLE_SUB,
      "victim_handle",
      "victim Full Name",
      "victim bio",
      "cdn.example.com/victim",
      "victim agent",
      "+5511900000001",
    ];

    it("in any public table", async () => {
      for (const table of await publicTables(db)) {
        const rows = await dump(db, `public.${table}`);
        for (const marker of markers) {
          const hits = rows.filter((r) => r.includes(marker));
          expect(hits, `${table} still holds ${marker}`).toEqual([]);
        }
      }
    });

    it("in the auth schema", async () => {
      for (const table of AUTH_TABLES) {
        const rows = await dump(db, `auth.${table}`);
        for (const marker of markers) {
          const hits = rows.filter((r) => r.includes(marker));
          expect(hits, `auth.${table} still holds ${marker}`).toEqual([]);
        }
      }
    });
  });

  describe("each table does what the policy says", () => {
    const owned: Record<string, string> = {
      admin_users: "user_id",
      deployed_programs: "user_id",
      email_reminder_log: "user_id",
      review_items: "user_id",
      streak_freezes_used: "user_id",
      thread_views: "user_id",
    };

    it("delete: the account's rows are gone, the other account's stay", async () => {
      const deleted = Object.entries(DELETION_POLICY).filter(
        ([, p]) => p.decision === "delete"
      );
      expect(deleted.length).toBeGreaterThan(0);
      for (const [table] of deleted) {
        const col = owned[table];
        expect(col, `${table} needs a delete assertion here`).toBeDefined();
        const victim = await db.query(
          `SELECT 1 FROM public.${table} WHERE ${col} = $1`,
          [VICTIM]
        );
        expect(victim.rows, table).toHaveLength(0);
        const other = await db.query(
          `SELECT 1 FROM public.${table} WHERE ${col} = $1`,
          [BYSTANDER]
        );
        expect(other.rows, table).toHaveLength(1);
      }
    });

    it("scrub: profiles lose every personal value and stay tombstoned", async () => {
      const { rows } = await db.query<Record<string, unknown>>(
        "SELECT * FROM public.profiles WHERE id = $1",
        [VICTIM]
      );
      const p = rows[0]!;
      const notNull = ["username", "is_public", "verified", "prefs"];
      for (const [column, decision] of Object.entries(
        DELETION_POLICY.profiles!.columns!
      )) {
        if (decision !== "scrub" || notNull.includes(column)) continue;
        expect(p[column], column).toBeNull();
      }
      expect(p.prefs).toEqual({});
      expect(p.is_public).toBe(false);
      expect(p.verified).toBe(false);
      expect(p.username).toMatch(/^deleted-user-[0-9a-f]{12}$/);
      expect(p.username).not.toBe(
        `deleted-user-${createHash("md5").update(VICTIM).digest("hex").slice(0, 12)}`
      );
      expect(p.deleted_at).not.toBeNull();
      expect(p.deletion_requested_at).not.toBeNull();
    });

    it("scrub: consent is off and the opt-out is dated", async () => {
      const { rows } = await db.query<Record<string, unknown>>(
        "SELECT * FROM public.email_subscriptions WHERE user_id = $1",
        [VICTIM]
      );
      expect(rows[0]).toMatchObject({
        opt_in: false,
        reminder_opt_in: false,
        reminder_locale: null,
      });
      expect(rows[0]!.unsubscribed_at).not.toBeNull();
      expect(rows[0]!.reminder_unsubscribed_at).not.toBeNull();
    });

    it("scrub: chat text goes and the usage counters stay", async () => {
      const { rows } = await db.query<Record<string, unknown>>(
        "SELECT chat_log, assists_used FROM public.challenge_assists WHERE user_id = $1",
        [VICTIM]
      );
      expect(rows[0]).toEqual({ chat_log: [], assists_used: 4 });
    });

    it("scrub: credential metadata keeps every attribute but the recipient", async () => {
      const { rows } = await db.query<{
        data: { attributes: { trait_type: string; value: unknown }[] };
      }>("SELECT data FROM public.nft_metadata WHERE id = $1", [V_META_ID]);
      expect(rows[0]!.data.attributes).toEqual([
        { trait_type: "Course", value: "Course 1" },
        { trait_type: "Recipient", value: "Deleted user" },
        { trait_type: "Course Version", value: 3 },
      ]);
    });

    it("scrub: metadata naming the wallet is found without a certificate row", async () => {
      const { rows } = await db.query<{
        data: { attributes: { trait_type: string; value: unknown }[] };
      }>("SELECT data FROM public.nft_metadata WHERE id = $1", [
        V_WALLET_META_ID,
      ]);
      expect(rows[0]!.data.attributes).toEqual([
        { trait_type: "Recipient", value: "Deleted user" },
      ]);
    });

    it("scrub: queue rows stop retrying and lose their payload", async () => {
      const { rows } = await db.query<Record<string, unknown>>(
        "SELECT payload, last_error, resolved_at FROM public.pending_onchain_actions WHERE user_id = $1",
        [VICTIM]
      );
      expect(rows[0]!.payload).toEqual({});
      expect(rows[0]!.last_error).toBeNull();
      expect(rows[0]!.resolved_at).not.toBeNull();
    });

    it("scrub: spend rows drop the wallet, sponsored rows keep a one-way slot key", async () => {
      const plain = await db.query<{ wallet: string | null }>(
        "SELECT wallet FROM public.platform_spend WHERE signature = 'spend-victim'"
      );
      expect(plain.rows[0]!.wallet).toBeNull();
      const sponsored = await db.query<{ wallet: string }>(
        "SELECT wallet FROM public.platform_spend WHERE signature = 'sponsor-victim'"
      );
      // The ledger's own lookup must find what the RPC wrote.
      expect(sponsorshipWalletKeys(V_WALLET)).toContain(
        sponsored.rows[0]!.wallet
      );
      expect(sponsored.rows[0]!.wallet).not.toContain(V_WALLET);
    });

    it("scrub: consumed nonces stay consumed without wallet or IP", async () => {
      const { rows } = await db.query<Record<string, unknown>>(
        "SELECT status, wallet_address, ip_address FROM public.siws_nonces WHERE nonce = 'nonce-victim'"
      );
      expect(rows[0]).toEqual({
        status: "consumed",
        wallet_address: null,
        ip_address: null,
      });
    });

    it("scrub: flags keep the report and lose the reporter's text", async () => {
      const { rows } = await db.query<Record<string, unknown>>(
        "SELECT details, reason FROM public.flags WHERE reporter_id = $1",
        [VICTIM]
      );
      expect(rows[0]).toEqual({ details: null, reason: "other" });
    });

    it("scrub: the account's spend ledger row and rate-limit keys are gone", async () => {
      const spend = await db.query(
        "SELECT 1 FROM public.ai_spend_ledger WHERE scope_key = $1",
        [VICTIM]
      );
      expect(spend.rows).toHaveLength(0);
      const limits = await db.query(
        "SELECT 1 FROM public.rate_limits WHERE key LIKE $1",
        [`%${VICTIM}`]
      );
      expect(limits.rows).toHaveLength(0);
    });

    it("keep: forum posts stay with their author id", async () => {
      const t = await db.query<Record<string, unknown>>(
        "SELECT author_id, body, deleted_at FROM public.threads WHERE id = $1",
        [V_THREAD]
      );
      expect(t.rows[0]).toEqual({
        author_id: VICTIM,
        body: "thread body stays",
        deleted_at: null,
      });
      const a = await db.query<Record<string, unknown>>(
        "SELECT author_id, body FROM public.answers WHERE id = $1",
        [V_ANSWER]
      );
      expect(a.rows[0]).toEqual({
        author_id: VICTIM,
        body: "answer body stays",
      });
    });

    it("keep: on-chain mirrors and every idempotency key are unchanged", async () => {
      for (const table of [
        "xp_transactions",
        "user_xp",
        "user_progress",
        "user_achievements",
        "certificates",
        "user_daily_quests",
        "league_members",
        "referral_events",
        "votes",
        "moderation_actions",
      ]) {
        expect(await dump(db, `public.${table}`), table).toEqual(
          await dump(db, `snapshot.${table}`)
        );
      }
    });

    it("keep: an enrollment loses only its wallet copy", async () => {
      const { rows } = await db.query<Record<string, unknown>>(
        "SELECT wallet_address, tx_signature FROM public.enrollments WHERE user_id = $1",
        [VICTIM]
      );
      expect(rows[0]).toEqual({
        wallet_address: null,
        tx_signature: "enroll-sig-victim",
      });
    });
  });

  describe("the other account", () => {
    it("has identical rows in every table", async () => {
      const notVictims = (rows: string[]) =>
        rows.filter(
          (r) =>
            !r.includes(VICTIM) &&
            !r.includes(V_WALLET) &&
            !r.includes(V_META_ID) &&
            !r.includes(V_WALLET_META_ID) &&
            !r.includes("nonce-victim") &&
            !r.includes("spend-victim") &&
            !r.includes("sponsor-victim")
        );
      for (const table of await publicTables(db)) {
        expect(notVictims(await dump(db, `public.${table}`)), table).toEqual(
          notVictims(await dump(db, `snapshot.${table}`))
        );
      }
    });

    it("keeps their sign-in and consent", async () => {
      const { rows } = await db.query<Record<string, unknown>>(
        "SELECT email, banned_until FROM auth.users WHERE id = $1",
        [BYSTANDER]
      );
      expect(rows[0]).toEqual({
        email: "bystander@example.com",
        banned_until: null,
      });
      const subs = await db.query<{ opt_in: boolean }>(
        "SELECT opt_in FROM public.email_subscriptions WHERE user_id = $1",
        [BYSTANDER]
      );
      expect(subs.rows[0]!.opt_in).toBe(true);
    });
  });

  describe("auth", () => {
    it("rewrites the email to the placeholder domain every mail gate refuses", async () => {
      const { rows } = await db.query<{ email: string }>(
        "SELECT email FROM auth.users WHERE id = $1",
        [VICTIM]
      );
      expect(rows[0]!.email).toBe(
        `deleted-${VICTIM}@wallet.superteam-lms.local`
      );
    });

    it("leaves GoTrue's non-null string columns as empty strings, never NULL", async () => {
      // GoTrue scans these into plain Go strings; a NULL breaks every later read
      // of the row, including the ban call.
      const { rows } = await db.query<Record<string, unknown>>(
        `SELECT confirmation_token, recovery_token, email_change_token_new,
                email_change_token_current, email_change, phone_change,
                phone_change_token, reauthentication_token
         FROM auth.users WHERE id = $1`,
        [VICTIM]
      );
      for (const [column, value] of Object.entries(rows[0]!)) {
        expect(value, column).toBe("");
      }
    });

    it("clears metadata, phone and password, and marks the user deleted", async () => {
      const { rows } = await db.query<Record<string, unknown>>(
        `SELECT raw_user_meta_data, raw_app_meta_data, phone, encrypted_password,
                deleted_at, banned_until
         FROM auth.users WHERE id = $1`,
        [VICTIM]
      );
      const u = rows[0]!;
      expect(u.raw_user_meta_data).toEqual({});
      expect(u.raw_app_meta_data).toEqual({});
      expect(u.phone).toBeNull();
      expect(u.encrypted_password).toBeNull();
      expect(u.deleted_at).not.toBeNull();
      expect(u.banned_until).not.toBeNull();
    });

    it("removes audit rows that name the person as actor or as target", async () => {
      const { rows } = await db.query<{ r: string }>(
        "SELECT payload::text AS r FROM auth.audit_log_entries"
      );
      expect(rows.filter((row) => row.r.includes(VICTIM))).toEqual([]);
      expect(rows.filter((row) => row.r.includes(V_EMAIL))).toEqual([]);
      // Actor row, traits row and email-only row for the other account.
      expect(rows.filter((row) => row.r.includes("bystander"))).toHaveLength(3);
    });

    it("clears rows in an auth table added after this function was written", async () => {
      const { rows } = await db.query(
        "SELECT 1 FROM auth.future_user_table WHERE user_id = $1",
        [VICTIM]
      );
      expect(rows).toHaveLength(0);
      const other = await db.query(
        "SELECT 1 FROM auth.future_user_table WHERE user_id = $1",
        [BYSTANDER]
      );
      expect(other.rows).toHaveLength(1);
    });

    it("revokes every session in the same transaction", async () => {
      for (const table of [
        "sessions",
        "one_time_tokens",
        "flow_state",
        "mfa_factors",
      ]) {
        const { rows } = await db.query(
          `SELECT 1 FROM auth.${table} WHERE user_id = $1`,
          [VICTIM]
        );
        expect(rows, table).toHaveLength(0);
      }
      const tokens = await db.query(
        "SELECT 1 FROM auth.refresh_tokens WHERE user_id = $1",
        [VICTIM]
      );
      expect(tokens.rows).toHaveLength(0);
    });
  });

  // Once scrubbed, signing in with the same identity creates a new account.
  describe("coming back", () => {
    const NEW_ID = "33333333-3333-4333-8333-333333333333";

    it("no lookup resolves the old identity to the old account", async () => {
      const { rows } = await db.query<{ id: string | null }>(
        "SELECT public.find_user_by_oauth_identity('google', 'google-subject-of-victim') AS id"
      );
      expect(rows[0]!.id).toBeNull();
      const byWallet = await db.query(
        "SELECT 1 FROM public.profiles WHERE wallet_address = $1",
        [V_WALLET]
      );
      expect(byWallet.rows).toHaveLength(0);
    });

    it("the same email, provider subject and wallet can register again", async () => {
      await db.exec(`
        ${SERVICE_ON}
        INSERT INTO auth.users (id, email) VALUES ('${NEW_ID}', '${V_EMAIL}');
        INSERT INTO auth.identities (user_id, provider, provider_id, identity_data)
        VALUES ('${NEW_ID}', 'google', 'google-subject-of-victim', '{}');
        UPDATE public.profiles SET wallet_address = '${V_WALLET}' WHERE id = '${NEW_ID}';
        ${SERVICE_OFF}
      `);
      const { rows } = await db.query<{ deleted_at: unknown }>(
        "SELECT deleted_at FROM public.profiles WHERE id = $1",
        [NEW_ID]
      );
      expect(rows[0]!.deleted_at).toBeNull();
    });

    it("a re-run on the old account leaves the returned account alone", async () => {
      await db.exec(`
        ${SERVICE_ON}
        INSERT INTO public.enrollments (user_id, course_id, wallet_address)
        VALUES ('${NEW_ID}', 'course-2', '${V_WALLET}');
        INSERT INTO public.nft_metadata (id, data) VALUES
          ('44444444-4444-4444-8444-444444444444',
           jsonb_build_object('attributes', jsonb_build_array(
             jsonb_build_object('trait_type', 'Recipient', 'value', '${V_WALLET}'))));
        ${SERVICE_OFF}
      `);
      await run(db, VICTIM);
      const profile = await db.query<{ wallet_address: string }>(
        "SELECT wallet_address FROM public.profiles WHERE id = $1",
        [NEW_ID]
      );
      expect(profile.rows[0]!.wallet_address).toBe(V_WALLET);
      const meta = await db.query<{ recipient: string }>(
        `SELECT a ->> 'value' AS recipient
         FROM public.nft_metadata m, jsonb_array_elements(m.data -> 'attributes') a
         WHERE m.id = '44444444-4444-4444-8444-444444444444'`
      );
      expect(meta.rows[0]!.recipient).toBe(V_WALLET);
    });
  });

  describe("aggregates and public reads", () => {
    it("vote scores, answer counts and view counts are unchanged", async () => {
      const counts = (schema: string) =>
        db.query<Record<string, unknown>>(
          `SELECT id, vote_score, answer_count, view_count FROM ${schema}.threads ORDER BY id`
        );
      expect((await counts("public")).rows).toEqual(
        (await counts("snapshot")).rows
      );
    });

    it("the deleted account is out of every public surface", async () => {
      const profile = await db.query(
        "SELECT 1 FROM public.public_profiles WHERE id = $1",
        [VICTIM]
      );
      expect(profile.rows).toHaveLength(0);
      const xp = await db.query(
        "SELECT 1 FROM public.public_user_xp WHERE user_id = $1",
        [VICTIM]
      );
      expect(xp.rows).toHaveLength(0);
      const board = await db.query<{ user_id: string }>(
        "SELECT user_id FROM public.get_leaderboard()"
      );
      expect(board.rows.map((r) => r.user_id)).not.toContain(VICTIM);
    });

    // The referral_events row is kept (see the "keep" case above), but a
    // deleted referred account no longer scores for its referrer
    // (20261108130000_referral_score_after_lesson).
    it("the referral board stops counting the deleted account's referral", async () => {
      const { rows } = await db.query<{ user_id: string }>(
        "SELECT user_id FROM public.get_referral_leaderboard(99, 20)"
      );
      expect(rows.map((r) => r.user_id)).not.toContain(BYSTANDER);
    });

    describe("what an anonymous visitor reads", () => {
      const asAnon = async <T>(fn: () => Promise<T>): Promise<T> => {
        await db.exec(`
          GRANT SELECT ON public.certificates, public.nft_metadata TO anon;
          SET ROLE anon;
        `);
        try {
          return await fn();
        } finally {
          await db.exec("RESET ROLE;");
        }
      };

      it("the Academy credential page goes away", async () => {
        const rows = await asAnon(async () => {
          const r = await db.query(
            "SELECT 1 FROM public.certificates WHERE user_id = $1",
            [VICTIM]
          );
          return r.rows;
        });
        expect(rows).toHaveLength(0);
      });

      it("another account's credential is still there", async () => {
        const rows = await asAnon(async () => {
          const r = await db.query(
            "SELECT 1 FROM public.certificates WHERE user_id = $1",
            [BYSTANDER]
          );
          return r.rows;
        });
        expect(rows).toHaveLength(1);
      });

      it("the on-chain credential's metadata still resolves, without the name", async () => {
        const rows = await asAnon(async () => {
          const r = await db.query<{ data: { attributes: unknown[] } }>(
            "SELECT data FROM public.nft_metadata WHERE id = $1",
            [V_META_ID]
          );
          return r.rows;
        });
        expect(rows[0]!.data.attributes).toContainEqual({
          trait_type: "Recipient",
          value: "Deleted user",
        });
      });
    });

    it("the certificate row itself stays for the on-chain record", async () => {
      const { rows } = await db.query<Record<string, unknown>>(
        "SELECT mint_address FROM public.certificates WHERE user_id = $1",
        [VICTIM]
      );
      expect(rows[0]).toEqual({ mint_address: "mint-victim" });
    });

    it("the same XP award can't land twice on the kept ledger", async () => {
      await expect(
        db.exec(`
          INSERT INTO public.xp_transactions (user_id, amount, reason, source, idempotency_key)
          VALUES ('${VICTIM}', 500, 'lesson', 'lesson', 'lesson:course-1:lesson-1');
        `)
      ).rejects.toThrow(/duplicate key|unique/i);
    });
  });
});

describe("delete_account_data, other starting states", () => {
  let db: PGlite;
  const OLD = "55555555-5555-4555-8555-555555555555";
  const OLD_WALLET = "OldWa11et55555555555555555555555555555555555";
  const SHELL = "66666666-6666-4666-8666-666666666666";
  const TARGET = "77777777-7777-4777-8777-777777777777";
  const SHARED_WALLET = "SharedWa11et777777777777777777777777777777";
  const OLD_META = "88888888-8888-4888-8888-888888888888";
  const TARGET_META = "99999999-1111-4999-8999-999999999999";
  const SPOOFER = "12121212-1212-4212-8212-121212121212";
  const SPOOFER_PLACEHOLDER = "13131313-1313-4313-8313-131313131313";
  const UNLINKED_WALLET = "Un1inkedWa11et88888888888888888888888888888";
  const UNLINKED_META = "14141414-1414-4414-8414-141414141414";

  beforeAll(async () => {
    const backfill = readFileSync(
      resolve(
        findRepoRoot(),
        "supabase/migrations/20261105130000_delete_account_data.sql.backfill"
      ),
      "utf8"
    );
    db = await buildFullLineage();
    await db.exec(`
      ${SERVICE_ON}
      -- Deleted under the old route: profile scrubbed, auth row untouched.
      INSERT INTO auth.users (id, email, raw_user_meta_data)
      VALUES ('${OLD}', '${OLD_WALLET.toLowerCase()}@wallet.superteam-lms.local',
              '{"wallet_address":"${OLD_WALLET}"}');
      UPDATE public.profiles SET username = 'deleted-user-abcd1234', wallet_address = NULL,
        deleted_at = '2026-08-01T00:00:00Z', deletion_requested_at = '2026-08-01T00:00:00Z'
      WHERE id = '${OLD}';
      INSERT INTO public.nft_metadata (id, data) VALUES ('${OLD_META}',
        jsonb_build_object('attributes', jsonb_build_array(
          jsonb_build_object('trait_type', 'Recipient', 'value', '${OLD_WALLET}'))));

      -- A merged shell: tombstoned, its wallet now owned by a live account.
      INSERT INTO auth.users (id, email, raw_user_meta_data)
      VALUES ('${SHELL}', '${SHARED_WALLET.toLowerCase()}@wallet.superteam-lms.local',
              '{"wallet_address":"${SHARED_WALLET}"}'),
             ('${TARGET}', 'target@example.com', '{}');

      -- user_metadata is user-writable: claiming a wallet there must get nothing.
      INSERT INTO auth.users (id, email, raw_user_meta_data)
      VALUES ('${SPOOFER}', 'spoofer@example.com', '{"wallet_address":"${UNLINKED_WALLET}"}'),
             ('${SPOOFER_PLACEHOLDER}', 'realwallet111@wallet.superteam-lms.local',
              '{"wallet_address":"${UNLINKED_WALLET}"}');
      UPDATE public.profiles SET deleted_at = now() WHERE id IN ('${SPOOFER}', '${SPOOFER_PLACEHOLDER}');
      INSERT INTO public.nft_metadata (id, data) VALUES ('${UNLINKED_META}',
        jsonb_build_object('attributes', jsonb_build_array(
          jsonb_build_object('trait_type', 'Recipient', 'value', '${UNLINKED_WALLET}'))));
      UPDATE public.profiles SET deleted_at = now() WHERE id = '${SHELL}';
      UPDATE public.profiles SET wallet_address = '${SHARED_WALLET}' WHERE id = '${TARGET}';
      INSERT INTO public.nft_metadata (id, data) VALUES ('${TARGET_META}',
        jsonb_build_object('attributes', jsonb_build_array(
          jsonb_build_object('trait_type', 'Recipient', 'value', '${SHARED_WALLET}'))));
      INSERT INTO public.platform_spend (signature, action, user_id, wallet, payer, payer_role, cluster, status)
      VALUES ('spend-target', 'complete_lesson', '${TARGET}', '${SHARED_WALLET}', 'SponsorKey', 'sponsor', 'devnet', 'confirmed');
      ${SERVICE_OFF}
    `);
    await db.exec(backfill);
  }, 180_000);
  afterAll(async () => {
    await db.close();
  });

  const recipient = async (id: string) => {
    const { rows } = await db.query<{ value: string }>(
      `SELECT a ->> 'value' AS value
       FROM public.nft_metadata m, jsonb_array_elements(m.data -> 'attributes') a
       WHERE m.id = $1 AND a ->> 'trait_type' = 'Recipient'`,
      [id]
    );
    return rows[0]!.value;
  };

  it("the backfill finishes an account deleted under the old route", async () => {
    const { rows } = await db.query<{ email: string }>(
      "SELECT email FROM auth.users WHERE id = $1",
      [OLD]
    );
    expect(rows[0]!.email).toBe(`deleted-${OLD}@wallet.superteam-lms.local`);
    expect(await recipient(OLD_META)).toBe("Deleted user");
  });

  it("a wallet claimed only in user_metadata is ignored", async () => {
    expect(await recipient(UNLINKED_META)).toBe(UNLINKED_WALLET);
  });

  it("keeps a tombstone's existing deleted-user name", async () => {
    const { rows } = await db.query<{ username: string }>(
      "SELECT username FROM public.profiles WHERE id = $1",
      [OLD]
    );
    expect(rows[0]!.username).toBe("deleted-user-abcd1234");
  });

  it("the backfill keeps the original deletion date", async () => {
    const { rows } = await db.query<{ deleted_at: Date }>(
      "SELECT deleted_at FROM public.profiles WHERE id = $1",
      [OLD]
    );
    expect(rows[0]!.deleted_at.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("a merged shell doesn't touch the wallet its live owner holds now", async () => {
    expect(await recipient(TARGET_META)).toBe(SHARED_WALLET);
    const spend = await db.query<{ wallet: string }>(
      "SELECT wallet FROM public.platform_spend WHERE signature = 'spend-target'"
    );
    expect(spend.rows[0]!.wallet).toBe(SHARED_WALLET);
    const { rows } = await db.query<{ wallet_address: string }>(
      "SELECT wallet_address FROM public.profiles WHERE id = $1",
      [TARGET]
    );
    expect(rows[0]!.wallet_address).toBe(SHARED_WALLET);
  });

  it("refuses an unknown account", async () => {
    await expect(
      run(db, "00000000-0000-4000-8000-000000000000")
    ).rejects.toThrow(/not found/i);
  });

  it.each([
    "delete_account_data",
    "purge_ai_spend_ip_rows",
    "list_deleted_account_avatar_owners",
  ])("%s is service-role only with a fixed search_path", async (fn) => {
    const { rows } = await db.query<Record<string, unknown>>(
      `SELECT has_function_privilege('anon', p.oid, 'EXECUTE') AS anon,
              has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authed,
              has_function_privilege('service_role', p.oid, 'EXECUTE') AS service,
              p.prosecdef AS definer,
              p.proconfig AS config
       FROM pg_proc p WHERE p.proname = $1`,
      [fn]
    );
    expect(rows[0]).toEqual({
      anon: false,
      authed: false,
      service: true,
      definer: true,
      config: ['search_path=""'],
    });
  });

  describe("list_deleted_account_avatar_owners", () => {
    const LIVE = "15151515-1515-4515-8515-151515151515";
    const UNFINISHED = "17171717-1717-4717-8717-171717171717";

    it("names only accounts the RPC finished that still have a file", async () => {
      await db.exec(`
        ${SERVICE_ON}
        INSERT INTO auth.users (id, email) VALUES
          ('${LIVE}', 'live-avatar@example.com'),
          ('${UNFINISHED}', 'unfinished@example.com');
        UPDATE public.profiles SET deleted_at = now() WHERE id = '${UNFINISHED}';
        ${SERVICE_OFF}
        INSERT INTO storage.objects (bucket_id, name) VALUES
          ('avatars', '${OLD}/avatar.jpg'),
          ('avatars', '${LIVE}/avatar.jpg'),
          ('avatars', '${UNFINISHED}/avatar.jpg'),
          ('other', '${SHELL}/avatar.jpg');
      `);
      const { rows } = await db.query<{ id: string }>(
        "SELECT public.list_deleted_account_avatar_owners(10) AS id"
      );
      expect(rows.map((r) => r.id)).toEqual([OLD]);
    });

    it("refuses a limit below one", async () => {
      await expect(
        db.query("SELECT public.list_deleted_account_avatar_owners(0)")
      ).rejects.toThrow(/p_limit/);
    });
  });

  describe("profile writes outside the service role", () => {
    const WRITER = "16161616-1616-4616-8616-161616161616";

    beforeAll(async () => {
      await db.exec(
        `INSERT INTO auth.users (id, email) VALUES ('${WRITER}', 'writer@example.com');`
      );
    });

    const setName = (id: string, name: string) =>
      db.query("UPDATE public.profiles SET username = $2 WHERE id = $1", [
        id,
        name,
      ]);

    it.each(["deleted-user-abc", "Deleted-User-abc", "DELETED-USER-1"])(
      "can't take the reserved name %s",
      async (name) => {
        await expect(setName(WRITER, name)).rejects.toThrow(/reserved/);
      }
    );

    it("can't insert a profile under a reserved name", async () => {
      await expect(
        db.query(
          "INSERT INTO public.profiles (id, username) VALUES (gen_random_uuid(), 'deleted-user-x')"
        )
      ).rejects.toThrow(/reserved/);
    });

    it("can still pick an ordinary name, including one near the prefix", async () => {
      await setName(WRITER, "deleted_user_fan");
      const { rows } = await db.query<{ username: string }>(
        "SELECT username FROM public.profiles WHERE id = $1",
        [WRITER]
      );
      expect(rows[0]!.username).toBe("deleted_user_fan");
    });

    it("can't change a tombstone at all", async () => {
      await expect(
        db.query("UPDATE public.profiles SET bio = 'back' WHERE id = $1", [OLD])
      ).rejects.toThrow(/deleted account/);
    });

    it("the service role can still re-run the deletion", async () => {
      await expect(run(db, OLD)).resolves.toBeDefined();
    });
  });
});

describe("purge_ai_spend_ip_rows", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await buildFullLineage();
    await db.exec(`
      INSERT INTO public.ai_spend_ledger (scope, scope_key, spend_day, micro_usd, request_count) VALUES
        ('ip', '${V_IP}', current_date - 40, 1, 1),
        ('ip', '198.51.100.2', current_date - 1, 1, 1),
        ('account', '${VICTIM}', current_date - 40, 1, 1),
        ('global', '', current_date - 40, 1, 1);
    `);
  }, 180_000);
  afterAll(async () => {
    await db.close();
  });

  it("drops only IP rows past the window", async () => {
    await db.query("SELECT public.purge_ai_spend_ip_rows(30)");
    const { rows } = await db.query<{ scope: string; scope_key: string }>(
      "SELECT scope, scope_key FROM public.ai_spend_ledger ORDER BY scope, scope_key"
    );
    expect(rows).toEqual([
      { scope: "account", scope_key: VICTIM },
      { scope: "global", scope_key: "" },
      { scope: "ip", scope_key: "198.51.100.2" },
    ]);
  });

  it("refuses a window that would wipe today's rate-limiting rows", async () => {
    await expect(
      db.query("SELECT public.purge_ai_spend_ip_rows(0)")
    ).rejects.toThrow(/keep_days/);
  });
});

// A returning wallet starts with empty progress while its chain bits stay set, so
// every lesson takes the route's already-complete path. Those rows don't count toward
// today's quests.
describe("delete and rejoin with the same wallet", () => {
  let db: PGlite;
  const WALLET = "Cyc1eWa11et9999999999999999999999999999999";
  const QUESTS = JSON.stringify([
    {
      id: "q-lesson",
      type: "lesson",
      xpReward: 20,
      targetValue: 1,
      resetType: "daily",
    },
    {
      id: "q-batch",
      type: "lesson_batch",
      xpReward: 40,
      targetValue: 2,
      resetType: "daily",
    },
    {
      id: "q-challenge",
      type: "challenge",
      xpReward: 35,
      targetValue: 1,
      resetType: "daily",
    },
    {
      id: "q-module",
      type: "module",
      xpReward: 60,
      targetValue: 1,
      resetType: "daily",
    },
  ]);
  const accountId = (n: number) =>
    `${String(n).repeat(8)}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`;

  const newAccount = async (id: string) => {
    await db.exec(`
      ${SERVICE_ON}
      INSERT INTO auth.users (id, email) VALUES ('${id}', '${WALLET.toLowerCase()}@wallet.superteam-lms.local');
      UPDATE public.profiles SET wallet_address = '${WALLET}' WHERE id = '${id}';
      ${SERVICE_OFF}
    `);
    const { rows } = await db.query<{ created_at: Date }>(
      "SELECT created_at FROM public.profiles WHERE id = $1",
      [id]
    );
    return rows[0]!.created_at.toISOString();
  };

  const complete = (id: string, lesson: string, completedAt: string | null) =>
    db.query(
      `INSERT INTO public.user_progress (user_id, course_id, lesson_id, completed, completed_at)
       VALUES ($1, 'course-1', $2, true, $3)
       ON CONFLICT (user_id, lesson_id) DO NOTHING`,
      [id, lesson, completedAt]
    );

  const evaluate = (id: string) =>
    db.query(
      `SELECT public.get_daily_quest_state($1, $2::jsonb, ARRAY['l1'],
         '[{"id":"m1","lessonIds":["l1","l2"]}]'::jsonb)`,
      [id, QUESTS]
    );

  const questCredits = async (id: string) => {
    const { rows } = await db.query(
      "SELECT 1 FROM public.pending_onchain_actions WHERE user_id = $1 AND action_type = 'quest_xp'",
      [id]
    );
    return rows.length;
  };

  beforeAll(async () => {
    db = await buildFullLineage();
  }, 180_000);
  afterAll(async () => {
    await db.close();
  });

  // Seconds since epoch: the enrollment the first account made, before any return.
  const enrolledAt = Math.floor(Date.now() / 1000) - 3600;

  it("earns quest XP once, however many times it comes back", async () => {
    const first = accountId(1);
    await newAccount(first);
    await complete(first, "l1", new Date().toISOString());
    await complete(first, "l2", new Date().toISOString());
    await evaluate(first);
    expect(await questCredits(first)).toBe(4);
    await db.query("SELECT public.delete_account_data($1)", [first]);

    for (const n of [2, 3, 4]) {
      const id = accountId(n);
      const createdAt = await newAccount(id);
      for (const lesson of ["l1", "l2"]) {
        await complete(id, lesson, recoveredCompletedAt(enrolledAt, createdAt));
      }
      await evaluate(id);
      expect(await questCredits(id), `cycle ${n}`).toBe(0);
      // The progress itself is still recorded.
      const { rows } = await db.query(
        "SELECT 1 FROM public.user_progress WHERE user_id = $1 AND completed",
        [id]
      );
      expect(rows).toHaveLength(2);
      await db.query("SELECT public.delete_account_data($1)", [id]);
    }
  });

  it("the same rows dated today do earn quest XP, so the test above can fail", async () => {
    const id = accountId(5);
    await newAccount(id);
    await complete(id, "l1", new Date().toISOString());
    await complete(id, "l2", new Date().toISOString());
    await evaluate(id);
    expect(await questCredits(id)).toBe(4);
  });
});
