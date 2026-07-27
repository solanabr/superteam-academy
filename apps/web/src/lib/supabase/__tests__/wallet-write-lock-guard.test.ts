import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #696 (mirrors the prod fix from #408): profiles.wallet_address was
// self-writable — the self-service profiles RLS policies (auth.uid() = id for
// INSERT/UPDATE) do not constrain WHICH columns are written, so any
// authenticated user could overwrite their own wallet_address and spoof the
// wallet identity that Helius XP resolution and the linked-wallet trust chain
// depend on. Production carries trg_enforce_profile_wallet_write (live since
// 2026-07-10) but supabase/schema.sql never mirrored it, so any DB built from
// the snapshot shipped WITHOUT the guard. RLS/triggers cannot be exercised in
// unit tests, so — as with the #493 profile guard and the #569 review spine —
// pin the security-critical SQL invariants in BOTH the migration that applies
// the fix and the schema.sql mirror new environments are built from. A drift
// between them is exactly the class of bug this test exists to prevent.

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
// The committed source of truth for the trigger definition (#408 was closed by
// this migration; the wallet-lock stanza lives in section (b)).
const migration = readFileSync(
  resolve(repoRoot, "supabase/migrations/20260710120000_drop_teacher_role.sql"),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

const FN = "public.enforce_profile_wallet_write()";
const TRIGGER = "trg_enforce_profile_wallet_write";

// The guard must hold in the migration (what gets applied) AND in schema.sql
// (the snapshot fresh environments are built from).
for (const [label, sql] of [
  ["migration", migration] as const,
  ["schema.sql", schema] as const,
]) {
  describe(`#696 wallet-write lock — ${label}`, () => {
    it("defines the trigger function exactly once", () => {
      const defs = sql.split(`CREATE OR REPLACE FUNCTION ${FN}`).length - 1;
      expect(defs).toBe(1);
    });

    it("installs the BEFORE INSERT OR UPDATE trigger exactly once", () => {
      const creates = sql.split(`CREATE TRIGGER ${TRIGGER}`).length - 1;
      expect(creates).toBe(1);
      const start = sql.indexOf(`CREATE TRIGGER ${TRIGGER}`);
      const body = sql.slice(start, start + 200);
      expect(body).toContain("BEFORE INSERT OR UPDATE ON public.profiles");
      expect(body).toContain("FOR EACH ROW");
      expect(body).toContain(`EXECUTE FUNCTION ${FN}`);
      // Drop-then-create so re-running the SQL is idempotent.
      expect(sql).toContain(
        `DROP TRIGGER IF EXISTS ${TRIGGER} ON public.profiles;`
      );
    });

    it("observes the CALLER's role (SECURITY INVOKER, pinned search_path)", () => {
      const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${FN}`);
      const body = sql.slice(start, sql.indexOf("$$;", start));
      // SECURITY DEFINER here would read the owner's role and defeat the check.
      expect(body).toContain("SECURITY INVOKER");
      expect(body).toContain("SET search_path = ''");
    });

    it("treats only service_role as privileged (direct role OR JWT claim)", () => {
      const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${FN}`);
      const body = sql.slice(start, sql.indexOf("$$;", start));
      expect(body).toContain("current_setting('request.jwt.claims', true)");
      expect(body).toContain(
        "current_user = 'service_role' OR jwt_role = 'service_role'"
      );
    });

    it("is keyed on wallet_address — non-service UPDATE that changes it errors", () => {
      const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${FN}`);
      const body = sql.slice(start, sql.indexOf("$$;", start));
      expect(body).toContain(
        "NEW.wallet_address IS DISTINCT FROM OLD.wallet_address"
      );
      expect(body).toContain(
        "wallet_address may only be changed by service_role"
      );
      expect(body).toContain("USING ERRCODE = 'insufficient_privilege'");
    });

    it("coerces a non-service INSERT's wallet_address to NULL", () => {
      const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${FN}`);
      const body = sql.slice(start, sql.indexOf("$$;", start));
      expect(body).toContain("IF NEW.wallet_address IS NOT NULL THEN");
      expect(body).toContain("NEW.wallet_address := NULL;");
    });

    it("revokes EXECUTE so the helper is not callable via PostgREST RPC", () => {
      expect(sql).toContain(
        `REVOKE EXECUTE ON FUNCTION ${FN} FROM PUBLIC, anon, authenticated;`
      );
    });
  });
}

describe("#696 wallet-write lock — mirror matches prod (#699)", () => {
  it("schema.sql mirrors the DEPLOYED wallet lock and NOT the retired role lock", () => {
    // profiles.role was retired by SP1 (migration 20260710120000): prod has no
    // role column, function, or trigger. The wallet-write lock is the surviving
    // escalation guard and must stay mirrored; the role machinery must be absent
    // so the snapshot matches prod. (#699 — this case previously pinned the
    // retired role trigger, a green assertion guarding nothing.)
    expect(schema).toContain(`CREATE OR REPLACE FUNCTION ${FN}`);
    expect(schema).toContain(`CREATE TRIGGER ${TRIGGER}`);
    // DDL must be gone (explanatory prose naming it is fine).
    expect(schema).not.toContain(
      "CREATE OR REPLACE FUNCTION public.enforce_profile_role_write()"
    );
    expect(schema).not.toContain(
      "CREATE TRIGGER trg_enforce_profile_role_write"
    );
  });

  it("guards a distinct column — wallet body never touches role/segment/goal", () => {
    // The wallet trigger touches only wallet_address; it never reads or writes
    // any segment/goal/daily_goal column (#695) or the retired role column, so
    // those columns are orthogonal to it.
    const start = schema.indexOf(`CREATE OR REPLACE FUNCTION ${FN}`);
    const body = schema.slice(start, schema.indexOf("$$;", start));
    expect(body).not.toMatch(/\bNEW\.role\b/);
    expect(body).not.toMatch(/\bsegment\b/);
    expect(body).not.toMatch(/\bdaily_goal\b/);
  });
});
