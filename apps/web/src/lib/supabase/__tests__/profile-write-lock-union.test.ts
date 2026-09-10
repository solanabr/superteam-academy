import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

/**
 * `enforce_profile_wallet_write` is the ONLY thing narrowing which columns a
 * learner may write on their own profile row: the RLS policy behind it is
 * `ON profiles FOR UPDATE USING (auth.uid() = id)`, with no column list, and
 * there are no column-level grants. Every privileged column on `profiles` —
 * wallet identity, editorial name, the verified badge — is locked by this one
 * function body and nothing else.
 *
 * Which makes `CREATE OR REPLACE FUNCTION` a loaded gun. It swaps the WHOLE
 * body, so a migration that adds a guard for its own new column while starting
 * from an older copy of the body DELETES the guards added in between — silently,
 * with a green migration, a passing suite and no error anywhere.
 *
 * That has now happened twice:
 *
 *   20260710120000 (#696)   wallet_address
 *   20260805120000 (#997)   wallet_address, display_name, verified
 *   20260824120000 (#1183)  wallet_address, wallet_kind    ← dropped #997's two
 *   20260910120000 (#1234)  all five                       ← first draft dropped wallet_kind
 *
 * #1183 is applied to production (ledger: 20260824213846), so `verified` and
 * `display_name` are self-writable on prod until #1234's migration lands.
 *
 * The per-column tests in wallet-write-lock-guard.test.ts could not catch
 * either one: they assert that a guard is PRESENT, and every version of the
 * body has always guarded the column its own migration cared about. What was
 * missing is the cumulative invariant — that the newest body is a superset of
 * every body before it. That is what this pins, derived from the migrations
 * themselves rather than from a hardcoded list, so it keeps holding for
 * whatever column gets locked next.
 *
 * Scope note: migrations only, deliberately. `supabase/schema.sql` carries its
 * own stale copy of this function (the #1183 one) and a `profiles` table with
 * no display_name/verified/verified_kind columns at all — it is coherent with
 * itself at that older point, and bringing the function forward without the
 * table would break every environment built from the snapshot. That drift is
 * the documented #1116 trap; it is not this test's job to paper over it.
 */

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

const FN = "CREATE OR REPLACE FUNCTION public.enforce_profile_wallet_write()";

interface Version {
  file: string;
  /** Columns the UPDATE branch refuses to let a non-service caller change. */
  update: Set<string>;
  /** Columns the INSERT branch coerces away from a non-service caller. */
  insert: Set<string>;
}

/** Every migration that replaces the guard, in application (filename) order. */
function guardVersions(repoRoot: string): Version[] {
  const dir = resolve(repoRoot, "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .flatMap((file) => {
      const sql = readFileSync(resolve(dir, file), "utf8");
      const start = sql.indexOf(FN);
      if (start === -1) return [];
      const body = sql.slice(start, sql.indexOf("$$;", start));
      const split = body.indexOf("ELSIF TG_OP = 'INSERT'");
      expect(split, `${file}: guard body has no INSERT branch`).toBeGreaterThan(
        -1
      );
      const matchAll = (s: string, re: RegExp): Set<string> =>
        new Set([...s.matchAll(re)].map((m) => m[1]!));
      return [
        {
          file,
          // `IF NEW.x IS DISTINCT FROM OLD.x THEN RAISE …`
          update: matchAll(
            body.slice(0, split),
            /NEW\.([a-z_]+) IS DISTINCT FROM OLD\.\1\b/g
          ),
          // `NEW.x := NULL;` for nullable columns, `NEW.verified := false;` for the flag.
          insert: matchAll(body.slice(split), /NEW\.([a-z_]+)\s*:=/g),
        },
      ];
    });
}

const repoRoot = findRepoRoot();
const versions = guardVersions(repoRoot);
const latest = versions[versions.length - 1]!;
const earlier = versions.slice(0, -1);

describe("profiles write lock — a replacement may only ever grow the guarded set", () => {
  it("finds the guard's full lineage across the migrations", () => {
    // A sanity floor: if this drops to one, the discovery above silently broke
    // and every assertion below would pass vacuously.
    expect(versions.length).toBeGreaterThanOrEqual(4);
    expect(latest.file).toBe("20260910120000_verified_kind.sql");
  });

  it("the newest body guards every column any earlier body guarded", () => {
    const inherited = new Set(earlier.flatMap((v) => [...v.update]));
    const dropped = [...inherited].filter((c) => !latest.update.has(c)).sort();
    expect(
      dropped,
      `${latest.file} drops UPDATE guards that earlier migrations added: ` +
        `${dropped.join(", ")}. CREATE OR REPLACE swaps the whole body — ` +
        `re-add them, do not rebase the body onto an older copy.`
    ).toEqual([]);
  });

  it("…and coerces every one of them on INSERT too, not just on UPDATE", () => {
    // A column guarded on UPDATE but not on INSERT is a pre-emptive squat:
    // the row is created with the value already set, so nothing is ever
    // "changed" and the UPDATE branch never fires.
    const missing = [...latest.update].filter((c) => !latest.insert.has(c));
    expect(missing.sort()).toEqual([]);
  });

  it("locks exactly the five privileged profile columns today", () => {
    // Named explicitly as well as derived: the derivation proves nothing was
    // LOST, this proves the set is what the security model actually intends.
    // Adding a privileged column means adding it here on purpose.
    expect([...latest.update].sort()).toEqual([
      "display_name",
      "verified",
      "verified_kind",
      "wallet_address",
      "wallet_kind",
    ]);
  });

  it("re-closes the #1183 regression: display_name and verified are guarded again", () => {
    const w = versions.find((v) => v.file.startsWith("20260824120000"))!;
    // Pinning the historical fact so the narrative above cannot rot: #1183
    // really did drop these, which is why applying #1234 is a fix and not
    // merely an addition.
    expect(w.update.has("display_name")).toBe(false);
    expect(w.update.has("verified")).toBe(false);
    expect(latest.update.has("display_name")).toBe(true);
    expect(latest.update.has("verified")).toBe(true);
  });
});
