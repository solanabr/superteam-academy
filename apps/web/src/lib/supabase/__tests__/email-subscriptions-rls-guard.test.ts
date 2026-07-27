import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #769: email_subscriptions is the marketing-consent model. RLS can't be run in
// unit tests, so pin the security-critical SQL invariants in BOTH the migration
// and the schema.sql mirror: opt-out by default, own-row read, NO write policy,
// and every write RPC hardened (SECURITY DEFINER, pinned search_path, REVOKEd
// from clients, GRANTed only to its intended role).

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
    "supabase/migrations/20260727140000_email_subscriptions.sql"
  ),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

// fn → [args, grantee]
const RPCS: ReadonlyArray<[string, string, string]> = [
  ["set_marketing_opt_in", "(BOOLEAN)", "authenticated"],
  ["list_marketing_recipients", "()", "service_role"],
  ["unsubscribe_by_token", "(UUID)", "service_role"],
];

for (const [label, sql] of [
  ["migration", migration] as const,
  ["schema.sql", schema] as const,
]) {
  describe(`#769 email_subscriptions — ${label}`, () => {
    it("defaults to OPT-OUT (never email without consent)", () => {
      expect(sql).toMatch(/opt_in\s+BOOLEAN NOT NULL DEFAULT false/);
    });

    it("enables RLS with an own-row SELECT policy and NO write policy", () => {
      expect(sql).toContain(
        "ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY"
      );
      expect(sql).toContain(
        "ON email_subscriptions FOR SELECT USING (auth.uid() = user_id)"
      );
      // No client write path — writes go through the SECURITY DEFINER RPCs.
      expect(sql).not.toMatch(
        /ON email_subscriptions FOR (INSERT|UPDATE|DELETE|ALL)/
      );
    });

    it("keeps the unsubscribe token unique (a token maps to one user)", () => {
      expect(sql).toContain("UNIQUE (unsubscribe_token)");
    });

    it("hardens every write RPC and grants it to the RIGHT role only", () => {
      for (const [fn, args, grantee] of RPCS) {
        const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${fn}(`);
        expect(start, `${fn} defined`).toBeGreaterThan(-1);
        const body = sql.slice(
          start,
          sql.indexOf("GRANT EXECUTE", start) + 200
        );
        expect(body).toContain("SECURITY DEFINER");
        expect(body).toContain("SET search_path = ''");
        expect(body).toContain(
          `GRANT EXECUTE ON FUNCTION ${fn}${args} TO ${grantee}`
        );
        // Never grant the pipeline/unsubscribe reads to anon/authenticated.
        if (grantee === "service_role") {
          expect(body).toContain(
            `REVOKE ALL ON FUNCTION ${fn}${args} FROM PUBLIC, anon, authenticated`
          );
        } else {
          expect(body).toContain(
            `REVOKE ALL ON FUNCTION ${fn}${args} FROM PUBLIC, anon`
          );
        }
      }
    });

    it("the self-service toggle is keyed on auth.uid() (can't touch another user)", () => {
      const start = sql.indexOf(
        "CREATE OR REPLACE FUNCTION set_marketing_opt_in("
      );
      const body = sql.slice(start, sql.indexOf("$$;", start));
      expect(body).toContain("auth.uid()");
      expect(body).not.toMatch(/p_user_id/); // no caller-supplied target user
    });

    it("the recipient read gates on opt_in = true AND an email on file", () => {
      const start = sql.indexOf(
        "CREATE OR REPLACE FUNCTION list_marketing_recipients("
      );
      const body = sql.slice(start, sql.indexOf("$$;", start));
      expect(body).toContain("es.opt_in = true");
      expect(body).toContain("u.email IS NOT NULL");
    });
  });
}

describe("#769 email_subscriptions — migration-only guarantees", () => {
  it("runs in one explicit transaction", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("ships a rollback dropping every RPC and the table", () => {
    for (const [fn, args] of RPCS) {
      expect(migration).toContain(`DROP FUNCTION IF EXISTS ${fn}${args}`);
    }
    expect(migration).toContain("DROP TABLE IF EXISTS email_subscriptions");
  });
});
