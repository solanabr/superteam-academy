import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// #869: reminder consent is a SECOND, independent consent type on
// email_subscriptions plus a service-role-only send ledger. RLS and role grants
// can't be exercised in unit tests, so pin the security-critical SQL invariants
// in BOTH the migration and the schema.sql mirror: opt-out by default, no client
// write path, no policy on the ledger, and every RPC hardened + granted to
// exactly one role.

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
  resolve(repoRoot, "supabase/migrations/20260731120000_reminder_consent.sql"),
  "utf8"
);
const schema = readFileSync(resolve(repoRoot, "supabase/schema.sql"), "utf8");

// fn → [args, sole grantee]
const RPCS: ReadonlyArray<[string, string, string]> = [
  ["set_reminder_opt_in", "(BOOLEAN, TEXT)", "authenticated"],
  ["claim_due_session_reminders", "(TEXT)", "service_role"],
  ["release_session_reminder_claims", "(UUID[])", "service_role"],
  ["unsubscribe_reminders_by_token", "(UUID)", "service_role"],
];

for (const [label, sql] of [
  ["migration", migration] as const,
  ["schema.sql", schema] as const,
]) {
  describe(`#869 reminder consent — ${label}`, () => {
    it("defaults to OPT-OUT (a plan or a marketing opt-in is never consent)", () => {
      expect(sql).toMatch(/reminder_opt_in\s+BOOLEAN NOT NULL DEFAULT false/);
    });

    it("adds NO client write policy to email_subscriptions", () => {
      expect(sql).not.toMatch(
        /ON email_subscriptions FOR (INSERT|UPDATE|DELETE|ALL)/
      );
    });

    it("locks the send ledger: RLS on, zero policies", () => {
      expect(sql).toContain(
        "ALTER TABLE email_reminder_log ENABLE ROW LEVEL SECURITY"
      );
      expect(sql).not.toContain("ON email_reminder_log");
    });

    it("makes one-per-day a PRIMARY KEY, not a code convention", () => {
      expect(sql).toContain("PRIMARY KEY (user_id, kind, sent_on)");
      expect(sql).toContain("ON CONFLICT (user_id, kind, sent_on) DO NOTHING");
    });

    it("gates the claim on REMINDER consent, never on marketing opt_in", () => {
      const start = sql.indexOf(
        "CREATE OR REPLACE FUNCTION claim_due_session_reminders("
      );
      expect(start).toBeGreaterThan(-1);
      const body = sql.slice(start, sql.indexOf("$$;", start));
      expect(body).toContain("es.reminder_opt_in = true");
      // `opt_in` (marketing) must not appear in the reminder recipient gate.
      expect(body).not.toMatch(/es\.opt_in/);
      // Never mail a synthetic wallet-auth address.
      expect(body).toContain("@wallet.superteam-lms.local");
      // São Paulo calendar day + weekday, not UTC.
      expect(body).toContain("America/Sao_Paulo");
    });

    it("keeps the two unsubscribes independent", () => {
      const start = sql.indexOf(
        "CREATE OR REPLACE FUNCTION unsubscribe_reminders_by_token("
      );
      expect(start).toBeGreaterThan(-1);
      const body = sql.slice(start, sql.indexOf("$$;", start));
      expect(body).toContain("SET reminder_opt_in = false");
      // Must not write EITHER marketing column (`opt_in`/`unsubscribed_at`) —
      // only their `reminder_`-prefixed counterparts.
      expect(body).not.toMatch(/(?<!reminder_)\bopt_in\s*=/);
      expect(body).not.toMatch(/(?<!reminder_)unsubscribed_at/);
    });

    it("hardens every RPC and grants it to the RIGHT role only", () => {
      for (const [fn, args, grantee] of RPCS) {
        const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${fn}(`);
        expect(start, `${fn} defined`).toBeGreaterThan(-1);
        const body = sql.slice(
          start,
          sql.indexOf("GRANT EXECUTE", start) + 200
        );
        expect(body, fn).toContain("SECURITY DEFINER");
        expect(body, fn).toContain("SET search_path = ''");
        expect(body, fn).toContain(
          `GRANT EXECUTE ON FUNCTION ${fn}${args} TO ${grantee}`
        );
        expect(body, fn).toContain(`REVOKE ALL ON FUNCTION ${fn}${args}`);
        if (grantee === "service_role") {
          // The pipeline reads must never be callable from a browser session.
          expect(body, fn).toContain("FROM PUBLIC, anon, authenticated");
        }
      }
    });

    it("only allows the locales the app actually ships", () => {
      expect(sql).toContain("reminder_locale IN ('en', 'pt-BR', 'es')");
    });
  });
}
