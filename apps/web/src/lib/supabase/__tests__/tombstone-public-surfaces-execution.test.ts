// REAL SQL-execution proof that a soft-deleted profile stays invisible on every
// public surface (#1120), run in in-process Postgres (pglite) against BOTH
// copies of the DDL: the migrations that get applied, and the
// supabase/schema.sql mirror that fresh environments are built from.
//
// THE HOLE. profiles.is_public is user-writable — the self-service RLS policies
// are column-agnostic, so `FOR UPDATE USING (auth.uid() = id)` says which ROW a
// caller may write, never which COLUMNS. #1115 locked deleted_at to
// service_role, which left is_public as the one lever a tombstoned account
// could still pull. Three of the six public surfaces gated only on is_public:
// community_stats, get_referral_leaderboard and is_public_profile. The other
// three (public_profiles, public_user_xp, get_leaderboard) had carried
// `deleted_at IS NULL` since 20260704140000_account_deletion.sql.
//
// Every object below is extracted from a real .sql file, never hand-written
// here, so a schema.sql that drifts from its migration fails this suite instead
// of quietly testing this file's idea of the schema. The last case in each
// describe is a live RED PROOF: it installs the three PRE-fix bodies from the
// migrations that originally defined them and asserts the tombstoned row comes
// back — so the suite proves it can still see the hole it closes.
//
// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";

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
const read = (rel: string): string =>
  readFileSync(resolve(repoRoot, rel), "utf8");

const SCHEMA = read("supabase/schema.sql");
/** The fix under test. */
const FIX = read(
  "supabase/migrations/20260820140000_tombstone_public_surfaces.sql"
);
/** Latest migration defining public_user_xp + get_leaderboard (both guarded). */
const ACCOUNT_DELETION = read(
  "supabase/migrations/20260704140000_account_deletion.sql"
);
/** Latest migration defining public_profiles (guarded). */
const TEACHER_FIELDS = read(
  "supabase/migrations/20260805120000_teacher_display_name_and_verified.sql"
);
// The three pre-fix bodies, each from the migration that last defined it before
// 20260820140000. These drive the red proof only.
const PRE_COMMUNITY_STATS = read(
  "supabase/migrations/20260624181348_tighten_leaderboard_exposure.sql"
);
const PRE_IS_PUBLIC_PROFILE = read(
  "supabase/migrations/20260726130000_route_public_profile_reads_through_view.sql"
);
const PRE_REFERRAL_LEADERBOARD = read(
  "supabase/migrations/20260818150000_referral_program.sql"
);

/** Slice `start … terminator` out of a SQL file, or throw naming what is missing. */
function extract(
  sql: string,
  start: string,
  terminator: string,
  where: string
): string {
  const i = sql.indexOf(start);
  if (i < 0) throw new Error(`${where}: not found — ${JSON.stringify(start)}`);
  const j = sql.indexOf(terminator, i + start.length);
  if (j < 0) throw new Error(`${where}: unterminated — ${start}`);
  return sql.slice(i, j + terminator.length);
}

/** One `CREATE … VIEW <name> AS … ;` block (no view body here contains a `;`). */
const view = (sql: string, decl: string, where: string): string =>
  extract(sql, decl, ";", where);

/** One `CREATE OR REPLACE FUNCTION <sig> … $$;` block. */
const fn = (sql: string, decl: string, where: string): string =>
  extract(sql, decl, "$$;", where);

/** One single-statement `<needle> … ;`. */
const stmt = (sql: string, needle: string, where: string): string =>
  extract(sql, needle, ";", where);

// ── the three surfaces that already carried the guard ────────────────────────
// Sourced per copy so the two describes are genuinely independent builds: the
// "migration" copy sees only migration files, the mirror copy only schema.sql.
const GUARDED_FROM_MIGRATIONS = [
  view(
    TEACHER_FIELDS,
    "CREATE OR REPLACE VIEW public.public_profiles AS",
    "20260805120000"
  ),
  stmt(
    TEACHER_FIELDS,
    "REVOKE ALL ON public.public_profiles FROM",
    "20260805120000"
  ),
  stmt(
    TEACHER_FIELDS,
    "GRANT SELECT ON public.public_profiles TO",
    "20260805120000"
  ),
  view(
    ACCOUNT_DELETION,
    "CREATE OR REPLACE VIEW public_user_xp AS",
    "20260704140000"
  ),
  stmt(ACCOUNT_DELETION, "REVOKE ALL ON public_user_xp FROM", "20260704140000"),
  stmt(ACCOUNT_DELETION, "GRANT SELECT ON public_user_xp TO", "20260704140000"),
  fn(
    ACCOUNT_DELETION,
    "CREATE OR REPLACE FUNCTION public.get_leaderboard(",
    "20260704140000"
  ),
  stmt(
    ACCOUNT_DELETION,
    "GRANT EXECUTE ON FUNCTION public.get_leaderboard(",
    "20260704140000"
  ),
].join("\n");

const GUARDED_FROM_SCHEMA = [
  view(SCHEMA, "CREATE OR REPLACE VIEW public_profiles AS", "schema.sql"),
  stmt(SCHEMA, "REVOKE ALL ON public_profiles FROM", "schema.sql"),
  stmt(SCHEMA, "GRANT SELECT ON public_profiles TO", "schema.sql"),
  view(SCHEMA, "CREATE OR REPLACE VIEW public_user_xp AS", "schema.sql"),
  stmt(SCHEMA, "REVOKE ALL ON public_user_xp FROM", "schema.sql"),
  stmt(SCHEMA, "GRANT SELECT ON public_user_xp TO", "schema.sql"),
  fn(
    SCHEMA,
    "CREATE OR REPLACE FUNCTION public.get_leaderboard(",
    "schema.sql"
  ),
  stmt(
    SCHEMA,
    "GRANT EXECUTE ON FUNCTION public.get_leaderboard(",
    "schema.sql"
  ),
].join("\n");

// ── the three this migration fixes ───────────────────────────────────────────
// The migration copy runs the whole file (bodies AND grants together, exactly
// as it will be applied). The mirror copy is reassembled from schema.sql's own
// statements, so a mirror that lost the change — or lost a grant — fails.
const FIXED_FROM_SCHEMA = [
  fn(
    SCHEMA,
    "CREATE OR REPLACE FUNCTION public.is_public_profile(p_user_id uuid)",
    "schema.sql"
  ),
  stmt(
    SCHEMA,
    "REVOKE ALL ON FUNCTION public.is_public_profile(uuid) FROM",
    "schema.sql"
  ),
  stmt(
    SCHEMA,
    "GRANT EXECUTE ON FUNCTION public.is_public_profile(uuid) TO",
    "schema.sql"
  ),
  view(SCHEMA, "CREATE OR REPLACE VIEW community_stats AS", "schema.sql"),
  stmt(SCHEMA, "REVOKE ALL ON community_stats FROM", "schema.sql"),
  stmt(SCHEMA, "GRANT SELECT ON community_stats TO", "schema.sql"),
  fn(
    SCHEMA,
    "CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(",
    "schema.sql"
  ),
  stmt(
    SCHEMA,
    "GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard(",
    "schema.sql"
  ),
].join("\n");

/** The pre-#1120 bodies, verbatim from the migrations that last defined them. */
const PRE_FIX = [
  fn(
    PRE_IS_PUBLIC_PROFILE,
    "CREATE OR REPLACE FUNCTION public.is_public_profile(p_user_id uuid)",
    "20260726130000"
  ),
  stmt(
    PRE_COMMUNITY_STATS,
    "DROP VIEW IF EXISTS community_stats",
    "20260624181348"
  ),
  view(PRE_COMMUNITY_STATS, "CREATE VIEW community_stats AS", "20260624181348"),
  stmt(
    PRE_COMMUNITY_STATS,
    "GRANT SELECT ON community_stats TO",
    "20260624181348"
  ),
  fn(
    PRE_REFERRAL_LEADERBOARD,
    "CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(",
    "20260818150000"
  ),
].join("\n");

// Minimal stand-in for the surfaces under test: the three Supabase roles, a stub
// auth.uid() reading the JWT `sub` claim (exactly what Supabase's does), the
// base tables the six objects read, and the REAL public-read policy on
// enrollments so the downstream effect of is_public_profile is exercised rather
// than assumed. Only the columns these objects touch.
const STUB_SETUP = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role BYPASSRLS;

  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$
    SELECT (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
  $fn$;

  CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
    wallet_address text,
    username text UNIQUE,
    avatar_url text,
    bio text,
    social_links jsonb,
    display_name text,
    verified boolean NOT NULL DEFAULT false,
    is_public boolean NOT NULL DEFAULT true,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE public.user_xp (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id),
    total_xp integer NOT NULL DEFAULT 0,
    level integer NOT NULL DEFAULT 0
  );
  CREATE TABLE public.xp_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    amount integer NOT NULL,
    reason text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE public.threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NOT NULL REFERENCES public.profiles(id)
  );
  CREATE TABLE public.answers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NOT NULL REFERENCES public.profiles(id),
    is_accepted boolean NOT NULL DEFAULT false
  );
  CREATE TABLE public.referral_seasons (
    number integer PRIMARY KEY,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE public.referral_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid NOT NULL REFERENCES public.profiles(id),
    referred_id uuid NOT NULL,
    kind text NOT NULL,
    course_id text,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE public.enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    course_id text NOT NULL
  );

  ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
  GRANT SELECT ON public.enrollments TO anon, authenticated;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
`;

/** The real public-read policy on enrollments, taken from schema.sql. */
const ENROLLMENTS_PUBLIC_POLICY = stmt(
  SCHEMA,
  'CREATE POLICY "Public profile enrollments are viewable"',
  "schema.sql"
);

const LIVE = "11111111-1111-1111-1111-111111111111";
const TOMBSTONED = "44444444-4444-4444-4444-444444444444";
const REFERRED = "99999999-9999-9999-9999-999999999999";

/** The six public surfaces, plus the RLS path is_public_profile actually gates. */
const SURFACES = [
  "public_profiles",
  "public_user_xp",
  "get_leaderboard",
  "community_stats",
  "get_referral_leaderboard",
  "is_public_profile",
  "enrollments (via is_public_profile)",
] as const;
type Surface = (typeof SURFACES)[number];
type Visibility = Record<Surface, boolean>;

/** The three #1120 fixes, keyed by which surface they own. */
const FIXED_SURFACES: readonly Surface[] = [
  "community_stats",
  "get_referral_leaderboard",
  "is_public_profile",
];

async function become(
  db: PGlite,
  role: "anon" | "authenticated" | "service_role",
  sub?: string
): Promise<void> {
  await db.exec("RESET ROLE;");
  await db.query("SELECT set_config('request.jwt.claims', $1, false)", [
    JSON.stringify(sub ? { sub, role } : { role }),
  ]);
  await db.exec(`SET ROLE ${role};`);
}

async function returnsRow(
  db: PGlite,
  sql: string,
  id: string
): Promise<boolean> {
  const { rows } = await db.query(sql, [id]);
  return rows.length > 0;
}

/**
 * Which of the surfaces expose `id` to the caller currently in effect.
 * is_public_profile is a predicate, so "appears" means it answered true.
 */
async function seenBy(db: PGlite, id: string): Promise<Visibility> {
  const predicate = await db.query<{ ok: boolean }>(
    "SELECT public.is_public_profile($1) AS ok",
    [id]
  );
  return {
    public_profiles: await returnsRow(
      db,
      "SELECT 1 FROM public.public_profiles WHERE id = $1",
      id
    ),
    public_user_xp: await returnsRow(
      db,
      "SELECT 1 FROM public.public_user_xp WHERE user_id = $1",
      id
    ),
    get_leaderboard: await returnsRow(
      db,
      "SELECT 1 FROM public.get_leaderboard('alltime', 100) WHERE user_id = $1",
      id
    ),
    community_stats: await returnsRow(
      db,
      "SELECT 1 FROM public.community_stats WHERE user_id = $1",
      id
    ),
    get_referral_leaderboard: await returnsRow(
      db,
      "SELECT 1 FROM public.get_referral_leaderboard(NULL, 100) WHERE user_id = $1",
      id
    ),
    is_public_profile: predicate.rows[0]?.ok === true,
    "enrollments (via is_public_profile)": await returnsRow(
      db,
      "SELECT 1 FROM public.enrollments WHERE user_id = $1",
      id
    ),
  };
}

const all = (value: boolean): Visibility =>
  Object.fromEntries(SURFACES.map((s) => [s, value])) as Visibility;

for (const copy of ["migration", "schema.sql mirror"] as const) {
  describe(`#1120 soft-deleted profiles stay off every public surface — ${copy}`, () => {
    let db: PGlite;
    const guarded =
      copy === "migration" ? GUARDED_FROM_MIGRATIONS : GUARDED_FROM_SCHEMA;
    const fixed = copy === "migration" ? FIX : FIXED_FROM_SCHEMA;

    // One pglite per describe — creating one per test starves the other pglite
    // suites when the whole file set runs in parallel (#922). State is reset in
    // beforeEach instead.
    beforeAll(async () => {
      db = new PGlite();
      await db.exec(STUB_SETUP);
      await db.exec(guarded);
      // Install the PRE-fix bodies first, so `fixed` lands as an in-place
      // upgrade of the shape that is actually deployed rather than onto a blank
      // database. That is the only way CREATE OR REPLACE VIEW's "may append
      // columns, never reorder or drop" rule gets exercised against the
      // 20260624181348 community_stats that prod really has.
      await db.exec(PRE_FIX);
      await db.exec(fixed);
      await db.exec(ENROLLMENTS_PUBLIC_POLICY);
    }, 60_000);

    beforeEach(async () => {
      await db.exec("RESET ROLE;");
      await db.query("SELECT set_config('request.jwt.claims', '', false)");
      // Re-install the fixed bodies before every case: the red proof swaps in
      // the pre-fix ones, and a failure partway through it must not silently
      // disarm the rest of the suite.
      await db.exec(fixed);
      await db.exec(`
        TRUNCATE public.enrollments, public.referral_events,
                 public.referral_seasons, public.answers, public.threads,
                 public.xp_transactions, public.user_xp, public.profiles CASCADE;
      `);
      // Both rows are public and carry a real username, XP, community activity,
      // a referral and an enrollment — everything each surface keys on. The only
      // difference is the tombstone, and TOMBSTONED keeps is_public = true: that
      // is the post-#1115 exploit's end state, the account having flipped back
      // the one column it can still write.
      await db.exec(`
        INSERT INTO public.profiles(id, username, wallet_address, is_public, deleted_at) VALUES
          ('${LIVE}',       'real-learner',       'WaLLet1', true, NULL),
          ('${TOMBSTONED}', 'deleted-user-abc123','WaLLet4', true, now()),
          ('${REFERRED}',   'newcomer',           'WaLLet9', true, NULL);
        INSERT INTO public.user_xp(user_id, total_xp, level) VALUES
          ('${LIVE}', 1200, 3), ('${TOMBSTONED}', 900, 2);
        INSERT INTO public.xp_transactions(user_id, amount, reason) VALUES
          ('${LIVE}', 50, 'community:answer_accepted'),
          ('${TOMBSTONED}', 50, 'community:answer_accepted');
        INSERT INTO public.threads(author_id) VALUES ('${LIVE}'), ('${TOMBSTONED}');
        INSERT INTO public.answers(author_id, is_accepted) VALUES
          ('${LIVE}', true), ('${TOMBSTONED}', true);
        INSERT INTO public.enrollments(user_id, course_id) VALUES
          ('${LIVE}', 'solana-101'), ('${TOMBSTONED}', 'solana-101');
        INSERT INTO public.referral_seasons(number, starts_at, ends_at) VALUES
          (1, now() - interval '1 day', now() + interval '30 days');
        INSERT INTO public.referral_events(referrer_id, referred_id, kind, course_id) VALUES
          ('${LIVE}', '${REFERRED}', 'signup', NULL),
          ('${TOMBSTONED}', '${REFERRED}', 'course_completion', 'solana-101');
      `);
    });

    afterAll(async () => {
      await db.close();
    });

    it("hides the tombstoned profile from all six surfaces, for anon", async () => {
      await become(db, "anon");
      expect(await seenBy(db, TOMBSTONED)).toEqual(all(false));
    });

    it("hides it from another signed-in user too", async () => {
      await become(db, "authenticated", LIVE);
      expect(await seenBy(db, TOMBSTONED)).toEqual(all(false));
    });

    it("control: the live profile is still returned by all six", async () => {
      await become(db, "anon");
      expect(await seenBy(db, LIVE)).toEqual(all(true));
    });

    it("is_public = true on a tombstoned row buys nothing", async () => {
      // The exploit's whole payload, applied directly. Post-#1115 the row can
      // only reach this state via is_public, and after this migration that
      // column no longer decides anything for a tombstoned row.
      await become(db, "service_role");
      await db.query(
        "UPDATE public.profiles SET is_public = true WHERE id = $1",
        [TOMBSTONED]
      );
      await become(db, "anon");
      expect(await seenBy(db, TOMBSTONED)).toEqual(all(false));

      // ...and clearing the tombstone (service_role only, e.g. an admin
      // restore) brings the account back everywhere. The guard keys on
      // deleted_at, not on some second, sticky flag.
      await become(db, "service_role");
      await db.query(
        "UPDATE public.profiles SET deleted_at = NULL WHERE id = $1",
        [TOMBSTONED]
      );
      await become(db, "anon");
      expect(await seenBy(db, TOMBSTONED)).toEqual(all(true));
    });

    it("community_stats still shows a tombstoned user their OWN row", async () => {
      // Deliberate, and the reason the guard sits on the public branch only:
      // account_deletion keeps own-row access intact (it left "Users can view
      // their own profile" in place so /settings still loads after a deletion
      // request). The public branch is the whole of the reported hole.
      await become(db, "authenticated", TOMBSTONED);
      const seen = await seenBy(db, TOMBSTONED);
      expect(seen.community_stats).toBe(true);
      // Every surface that is purely public stays shut, including to itself.
      expect(seen.public_profiles).toBe(false);
      expect(seen.public_user_xp).toBe(false);
      expect(seen.get_leaderboard).toBe(false);
      expect(seen.get_referral_leaderboard).toBe(false);
      expect(seen.is_public_profile).toBe(false);
    });

    it("RED PROOF: the pre-#1120 bodies leak the tombstoned row", async () => {
      await db.exec("RESET ROLE;");
      await db.exec(PRE_FIX);
      await become(db, "anon");
      const seen = await seenBy(db, TOMBSTONED);

      // Exactly the three this migration changes come back, and only those.
      for (const surface of FIXED_SURFACES) {
        expect(seen[surface], `${surface} should leak without the fix`).toBe(
          true
        );
      }
      // The downstream RLS path leaks with them — this is user-visible data,
      // not just a boolean.
      expect(seen["enrollments (via is_public_profile)"]).toBe(true);
      // The three that always had the guard never leaked.
      expect(seen.public_profiles).toBe(false);
      expect(seen.public_user_xp).toBe(false);
      expect(seen.get_leaderboard).toBe(false);
    });
  });
}
