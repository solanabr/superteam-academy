/**
 * In-memory stand-in for the slice of the Supabase query builder the spend
 * ledger uses, with the table's two unique rules: `signature`, and one live
 * (pending or confirmed) `enroll_sponsor` row per (cluster, wallet, course).
 * The real constraints are exercised against Postgres in
 * `platform-spend-ledger-execution.test.ts`; this keeps the TS logic tests
 * honest about the same rules without a database.
 */

export type Row = Record<string, unknown>;

type Filter = (row: Row) => boolean;

export interface FakeDb {
  tables: Record<string, Row[]>;
  /** Next write on `table` fails with this error instead of running. */
  failNext: (table: string, error: { code?: string; message: string }) => void;
  from: (table: string) => QueryBuilder;
}

interface QueryBuilder extends PromiseLike<{ data: unknown; error: unknown }> {
  select: (cols?: string) => QueryBuilder;
  insert: (row: Row) => QueryBuilder;
  upsert: (
    row: Row,
    opts: { onConflict: string; ignoreDuplicates?: boolean }
  ) => QueryBuilder;
  update: (patch: Row) => QueryBuilder;
  eq: (col: string, value: unknown) => QueryBuilder;
  in: (col: string, values: unknown[]) => QueryBuilder;
  lt: (col: string, value: string) => QueryBuilder;
  order: (col: string, opts: { ascending: boolean }) => QueryBuilder;
  limit: (n: number) => QueryBuilder;
  maybeSingle: () => QueryBuilder;
}

const LIVE = new Set(["pending", "confirmed"]);

function violatesOncePer(rows: Row[], row: Row, except?: Row): boolean {
  if (row.action !== "enroll_sponsor" || !LIVE.has(String(row.status))) {
    return false;
  }
  return rows.some(
    (r) =>
      r !== except &&
      r.action === "enroll_sponsor" &&
      LIVE.has(String(r.status)) &&
      r.cluster === row.cluster &&
      r.wallet === row.wallet &&
      r.course_id === row.course_id
  );
}

const UNIQUE = { code: "23505", message: "duplicate key value" };

export function createFakeDb(): FakeDb {
  const tables: Record<string, Row[]> = { platform_spend: [], profiles: [] };
  const failures = new Map<string, { code?: string; message: string }>();

  function from(table: string): QueryBuilder {
    const rows = (tables[table] ??= []);
    const filters: Filter[] = [];
    let op: "select" | "insert" | "upsert" | "update" = "select";
    let payload: Row = {};
    let upsertIgnore = false;
    let single = false;
    let returning = false;
    let max = Infinity;
    let orderBy: { col: string; asc: boolean } | null = null;

    const run = (): { data: unknown; error: unknown } => {
      if (op !== "select" && failures.has(table)) {
        const error = failures.get(table);
        failures.delete(table);
        return { data: null, error };
      }
      if (op === "insert" || op === "upsert") {
        const row: Row = {
          status: "pending",
          created_at: new Date().toISOString(),
          ...payload,
        };
        if (rows.some((r) => r.signature === row.signature)) {
          return op === "upsert" && upsertIgnore
            ? { data: null, error: null }
            : { data: null, error: UNIQUE };
        }
        if (violatesOncePer(rows, row)) return { data: null, error: UNIQUE };
        rows.push(row);
        return { data: null, error: null };
      }
      const matched = rows.filter((r) => filters.every((f) => f(r)));
      if (op === "update") {
        const updated: Row[] = [];
        for (const r of matched) {
          const next = { ...r, ...payload };
          if (violatesOncePer(rows, next, r))
            return { data: null, error: UNIQUE };
          Object.assign(r, payload);
          updated.push(r);
        }
        return {
          data: returning ? updated.map((r) => ({ ...r })) : null,
          error: null,
        };
      }
      let out = [...matched];
      if (orderBy) {
        const { col, asc } = orderBy;
        out.sort((a, b) =>
          String(a[col]) < String(b[col]) ? (asc ? -1 : 1) : asc ? 1 : -1
        );
      }
      out = out.slice(0, max).map((r) => ({ ...r }));
      return { data: single ? (out[0] ?? null) : out, error: null };
    };

    const builder: QueryBuilder = {
      select: () => {
        if (op === "update") returning = true;
        return builder;
      },
      insert: (row) => {
        op = "insert";
        payload = row;
        return builder;
      },
      upsert: (row, opts) => {
        op = "upsert";
        payload = row;
        upsertIgnore = opts.ignoreDuplicates === true;
        return builder;
      },
      update: (patch) => {
        op = "update";
        payload = patch;
        return builder;
      },
      eq: (col, value) => {
        filters.push((r) => r[col] === value);
        return builder;
      },
      in: (col, values) => {
        filters.push((r) => values.includes(r[col]));
        return builder;
      },
      lt: (col, value) => {
        filters.push((r) => String(r[col]) < value);
        return builder;
      },
      order: (col, opts) => {
        orderBy = { col, asc: opts.ascending };
        return builder;
      },
      limit: (n) => {
        max = n;
        return builder;
      },
      maybeSingle: () => {
        single = true;
        return builder;
      },
      then: (onFulfilled, onRejected) =>
        Promise.resolve(run()).then(onFulfilled, onRejected),
    };
    return builder;
  }

  return {
    tables,
    failNext: (table, error) => failures.set(table, error),
    from,
  };
}
