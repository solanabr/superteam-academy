import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #493: the profiles public-read RLS policy leaked google_id/github_id of any
// public profile to any logged-in user. RLS cannot be exercised in unit tests,
// so pin the SQL artifacts that enforce the fix: the migration drops the public
// row policy and reroutes the four dependent public-read policies through a
// SECURITY DEFINER helper; schema.sql mirrors that end-state; public_profiles is
// the sole cross-user surface and never projects a sensitive column.

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
    "supabase/migrations/20260726130000_route_public_profile_reads_through_view.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

const PUBLIC_PROFILE_POLICY = `"Public profiles are viewable by everyone"`;
const DEPENDENT_POLICIES: ReadonlyArray<[string, string]> = [
  [`"Public profile enrollments are viewable"`, "enrollments"],
  [`"Public profile progress is viewable"`, "user_progress"],
  [
    `"Public achievements are viewable on public profiles"`,
    "user_achievements",
  ],
  [`"Public certificates are viewable by everyone"`, "certificates"],
];

describe("#493 migration — routes public profile reads through the view", () => {
  it("drops the public-profile row policy on the base profiles table", () => {
    expect(migration).toContain(
      `DROP POLICY IF EXISTS ${PUBLIC_PROFILE_POLICY} ON profiles;`
    );
  });

  it("creates the SECURITY DEFINER is_public_profile helper, exec- but not sensitive-column exposing", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.is_public_profile(p_user_id uuid)"
    );
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.is_public_profile(uuid) TO anon, authenticated;"
    );
  });

  it("reroutes each dependent public-read policy through the helper (not an inline profiles subquery)", () => {
    for (const [policy, table] of DEPENDENT_POLICIES) {
      expect(migration).toContain(
        `DROP POLICY IF EXISTS ${policy} ON ${table};`
      );
      expect(migration).toContain(
        `ON ${table} FOR SELECT USING (public.is_public_profile(user_id));`
      );
    }
  });

  it("extends public_profiles with id + created_at and runs in one transaction", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE VIEW public.public_profiles"
    );
    expect(migration).toContain("p.id");
    expect(migration).toContain("p.created_at");
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });
});

describe("#493 schema.sql end-state", () => {
  it("has no public-profile row policy on profiles, keeps own-row SELECT", () => {
    expect(schema).not.toContain(`CREATE POLICY ${PUBLIC_PROFILE_POLICY}`);
    expect(schema).toContain(
      `CREATE POLICY "Users can view their own profile"`
    );
  });

  it("defines is_public_profile and uses it for every dependent policy", () => {
    expect(schema).toContain(
      "CREATE OR REPLACE FUNCTION public.is_public_profile(p_user_id uuid)"
    );
    for (const [, table] of DEPENDENT_POLICIES) {
      expect(schema).toContain(
        `ON ${table} FOR SELECT USING (public.is_public_profile(user_id));`
      );
    }
    // No stale inline profiles subquery left behind in any dependent policy.
    expect(schema).not.toContain("WHERE profiles.id = enrollments.user_id");
    expect(schema).not.toContain("WHERE profiles.id = certificates.user_id");
  });

  it("public_profiles projects id + created_at but never a sensitive OAuth column", () => {
    const viewStart = schema.indexOf("CREATE OR REPLACE VIEW public_profiles");
    expect(viewStart).toBeGreaterThan(-1);
    const view = schema.slice(viewStart, viewStart + 400);
    expect(view).toContain("p.id");
    expect(view).toContain("p.created_at");
    expect(view).not.toContain("google_id");
    expect(view).not.toContain("github_id");
  });
});
