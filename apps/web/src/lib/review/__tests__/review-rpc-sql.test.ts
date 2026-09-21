import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Static guard for the `column reference "x" is ambiguous` class of bug.
 *
 * A plpgsql function declared `RETURNS TABLE (box SMALLINT, ...)` gets an
 * implicit OUT variable named `box` for the whole body. Any UNQUALIFIED `box`
 * in a WHERE clause over a table that also has a `box` column is then
 * ambiguous, and under the default `plpgsql.variable_conflict = error` Postgres
 * raises at RUNTIME — not at CREATE time. So the function deploys clean and
 * fails on every call.
 *
 * `schedule_review_item` shipped exactly that (`WHERE box = 1`) and therefore
 * never once succeeded on prod: `review_items` held only its own migration's
 * backfill rows, and every graded miss logged
 * `[LESSON_COMPLETE_001] column reference "box" is ambiguous` instead of
 * enqueueing a review item. `captureReviewFailure` is best-effort by contract,
 * so nothing surfaced to the learner and nothing failed CI.
 *
 * Nothing else in this repo can catch it — there is no pgTAP harness, and no
 * unit test can execute plpgsql. A text assertion over the committed SQL is the
 * available guard, so this test reads the real files rather than a fixture.
 */
const REPO_ROOT = path.resolve(__dirname, "../../../../../..");
const SCHEMA = path.join(REPO_ROOT, "supabase/schema.sql");
const MIGRATIONS = path.join(REPO_ROOT, "supabase/migrations");

interface PlpgsqlFn {
  name: string;
  /** OUT column names from `RETURNS TABLE (...)`. */
  outColumns: string[];
  body: string;
  source: string;
}

/**
 * Pull every `RETURNS TABLE` plpgsql function out of one SQL file. Deliberately
 * regex-based: a real parser is overkill for "is this identifier qualified".
 */
function parseReturnsTableFunctions(sql: string, source: string): PlpgsqlFn[] {
  const fns: PlpgsqlFn[] = [];
  const re =
    /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?(\w+)\s*\([\s\S]*?\)\s*RETURNS\s+TABLE\s*\(([\s\S]*?)\)\s*\n[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$\s*;/gi;

  for (const m of sql.matchAll(re)) {
    const [, name, returnsTable, body] = m;
    if (!name || !returnsTable || !body) continue;
    const outColumns = returnsTable
      .split(",")
      .map((col) => col.trim().split(/\s+/)[0])
      .filter((col): col is string => Boolean(col));
    fns.push({ name, outColumns, body, source });
  }
  return fns;
}

/**
 * The CURRENT definition of every `RETURNS TABLE` function.
 *
 * Applied migrations are immutable, so a superseded definition still sits in
 * the tree with the bug in it — this must not flag those. Migration files are
 * timestamp-prefixed, so the last file (lexicographically) that defines a
 * function name is the one in force; `schema.sql` is the current-state mirror
 * and is always checked.
 */
function currentFunctions(): PlpgsqlFn[] {
  const latestByName = new Map<string, PlpgsqlFn>();

  for (const file of readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(path.join(MIGRATIONS, file), "utf8");
    for (const fn of parseReturnsTableFunctions(
      sql,
      `supabase/migrations/${file}`
    )) {
      latestByName.set(fn.name, fn); // ascending order ⇒ last write wins
    }
  }

  return [
    ...parseReturnsTableFunctions(
      readFileSync(SCHEMA, "utf8"),
      "supabase/schema.sql"
    ),
    ...latestByName.values(),
  ];
}

/**
 * Find OUT-column names referenced UNQUALIFIED in a boolean predicate
 * (`WHERE x = ...`, `AND x = ...`, `ON x = ...`).
 *
 * Scoped to predicates on purpose. An `INSERT ... (box, due_at)` column list
 * and an `UPDATE ... SET box = ...` target are plain column names in a position
 * where plpgsql cannot substitute a variable, so they are never ambiguous — a
 * blanket "any bare occurrence" check would flag both and be ignored.
 */
function unqualifiedPredicateRefs(fn: PlpgsqlFn): string[] {
  const body = fn.body
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  return fn.outColumns.filter((col) => {
    const predicate = new RegExp(
      `\\b(?:WHERE|AND|OR|ON)\\s+${col}\\b\\s*(?:=|<|>|IS|IN|!=|<>)`,
      "i"
    );
    return predicate.test(body);
  });
}

describe("RETURNS TABLE plpgsql functions never reference an OUT column unqualified", () => {
  const fns = currentFunctions();

  it("finds the functions to check (guards the parser itself)", () => {
    expect(fns.length).toBeGreaterThan(0);
    expect(fns.map((f) => f.name)).toContain("schedule_review_item");
    const scheduleFn = fns.find((f) => f.name === "schedule_review_item");
    expect(scheduleFn?.outColumns).toEqual(["box", "due_at"]);
  });

  it("has no ambiguous OUT-column predicate anywhere in the committed SQL", () => {
    const offenders = fns
      .map((fn) => ({ fn, cols: unqualifiedPredicateRefs(fn) }))
      .filter(({ cols }) => cols.length > 0)
      .map(
        ({ fn, cols }) =>
          `${fn.source} :: ${fn.name}() — unqualified OUT column(s) in a predicate: ${cols.join(", ")}`
      );

    expect(offenders).toEqual([]);
  });

  it("would have caught the shipped schedule_review_item bug", () => {
    // The exact body that ran on prod from 2026-07-26 until this fix.
    const shipped: PlpgsqlFn = {
      name: "schedule_review_item",
      outColumns: ["box", "due_at"],
      source: "regression fixture",
      body: `
        DECLARE
          v_interval INT;
        BEGIN
          SELECT interval_days INTO v_interval
            FROM public.review_schedule WHERE box = 1;
          INSERT INTO public.review_items (user_id, item_key, box, due_at)
          VALUES (p_user_id, p_item_key, 1, now() + make_interval(days => v_interval));
        END;
      `,
    };

    expect(unqualifiedPredicateRefs(shipped)).toEqual(["box"]);
  });

  it("does not flag an INSERT column list or an UPDATE SET target", () => {
    // Both appear in the FIXED schedule_review_item / record_review_result and
    // are not ambiguous — a blanket bare-identifier check would false-positive.
    const fixed: PlpgsqlFn = {
      name: "fixture",
      outColumns: ["box", "due_at"],
      source: "regression fixture",
      body: `
        BEGIN
          SELECT rs.interval_days INTO v_interval
            FROM public.review_schedule rs WHERE rs.box = 1;
          INSERT INTO public.review_items (user_id, item_key, box, due_at)
          VALUES (p_user_id, p_item_key, 1, now());
          UPDATE public.review_items ri
             SET box = LEAST(ri.box + 1, v_max_box),
                 due_at = now()
           WHERE ri.user_id = p_user_id;
        END;
      `,
    };

    expect(unqualifiedPredicateRefs(fixed)).toEqual([]);
  });
});
