// Every table has a deletion decision. Adding a table or a column that points at
// a person fails here until someone decides what deleting an account does to it.
//
// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DELETION_POLICY } from "@/lib/account/deletion-policy";
import {
  buildFullLineage,
  readMigration,
} from "@/lib/supabase/__tests__/helpers/full-lineage";

// A column by these names points at a person, whatever table it is in.
const PERSON_COLUMN =
  /wallet|email|phone|ip_address|user_agent|username|display_name|(^|_)user_id$|author_id|reporter_id|referrer_id|referred_id|referred_by|actor_id|resolved_by|granted_by/;

describe("deletion policy", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await buildFullLineage();
  }, 180_000);
  afterAll(async () => {
    await db.close();
  });

  const tables = async () => {
    const { rows } = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    return rows.map((r) => r.table_name).sort();
  };

  it("covers every table in the schema", async () => {
    const missing = (await tables()).filter((t) => !DELETION_POLICY[t]);
    expect(
      missing,
      "add these to lib/account/deletion-policy.ts and to delete_account_data"
    ).toEqual([]);
  });

  it("names no table that doesn't exist", async () => {
    const known = await tables();
    expect(
      Object.keys(DELETION_POLICY).filter((t) => !known.includes(t))
    ).toEqual([]);
  });

  it("decides every column of profiles", async () => {
    const { rows } = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'profiles'`
    );
    const decided = Object.keys(DELETION_POLICY.profiles!.columns ?? {});
    expect(
      rows.map((r) => r.column_name).filter((c) => !decided.includes(c))
    ).toEqual([]);
  });

  it("decides every column that points at a person", async () => {
    const { rows } = await db.query<{
      table_name: string;
      column_name: string;
    }>(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name IN (SELECT table_name FROM information_schema.tables
                            WHERE table_schema = 'public' AND table_type = 'BASE TABLE')`
    );
    const fks = await db.query<{ table_name: string; column_name: string }>(
      `SELECT c.conrelid::regclass::text AS table_name, a.attname AS column_name
       FROM pg_constraint c
       JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
       WHERE c.contype = 'f'
         AND c.confrelid IN ('public.profiles'::regclass, 'auth.users'::regclass)
         AND c.connamespace = 'public'::regnamespace`
    );
    const pointing = new Set([
      ...rows
        .filter((r) => PERSON_COLUMN.test(r.column_name))
        .map((r) => `${r.table_name}.${r.column_name}`),
      ...fks.rows.map(
        (r) => `${r.table_name.replace(/^public\./, "")}.${r.column_name}`
      ),
    ]);
    const undecided = [...pointing].filter((key) => {
      const [table, column] = key.split(".") as [string, string];
      return !DELETION_POLICY[table]?.columns?.[column];
    });
    expect(undecided).toEqual([]);
  });

  it("marks a table as holding no user data only when it has no such column", () => {
    for (const [table, policy] of Object.entries(DELETION_POLICY)) {
      if (policy.decision === "no_user_data") {
        expect(policy.columns, table).toBeUndefined();
      }
    }
  });

  it("gives a reason for every decision", () => {
    for (const [table, policy] of Object.entries(DELETION_POLICY)) {
      expect(policy.why.length, table).toBeGreaterThan(0);
    }
  });

  it("delete_account_data mentions every table it deletes from or scrubs", () => {
    const sql = readMigration("20261105130000_delete_account_data.sql");
    for (const [table, policy] of Object.entries(DELETION_POLICY)) {
      if (policy.decision === "delete" || policy.decision === "scrub") {
        expect(sql, table).toContain(`public.${table}`);
      }
    }
  });
});
