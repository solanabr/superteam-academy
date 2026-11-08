// The AI spend reservation RPCs in pglite, on the real schema (every migration
// in order), so the low-trust check reads the real profiles and user_progress.
//
// What has to hold:
//   1. Low-trust (no completed lesson, or a profile under 24 hours old, or no
//      profile) is computed in SQL from the account id alone.
//   2. Low-trust accounts share the newcomer pool; once it is full they are
//      denied while an established learner is still served. They also stay
//      under their own account, IP and global caps.
//   3. A reservation is booked at once against every hard cap, so reservations
//      issued together never exceed a cap.
//   4. Settling books the actual cost and refunds the rest of the hold.
//   5. Bad input raises instead of reserving, and leaves the ledger untouched.
//   6. service_role only; the migration is idempotent.
//
// pglite runs one connection, so "issued together" here means queued together
// and run back to back. Row locks between real concurrent sessions are not
// exercised; what this proves is that each reservation sees every earlier one.
//
// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildFullLineage, readMigration } from "./helpers/full-lineage";

const MIGRATION = "20261108120000_ai_spend_newcomer_pool.sql";

const ESTABLISHED = "11111111-1111-4111-8111-111111111111";
const OLD_NO_LESSON = "22222222-2222-4222-8222-222222222222";
const FRESH_WITH_LESSON = "33333333-3333-4333-8333-333333333333";
const NO_PROFILE = "44444444-4444-4444-8444-444444444444";
const ESTABLISHED_2 = "55555555-5555-4555-8555-555555555555";
// Signup derives the username from the first 8 id characters, so each fixture
// id needs its own prefix.
const FRESH = Array.from(
  { length: 12 },
  (_, i) => `${String(i).padStart(2, "0")}aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`
);

const SERVICE_ON = `SELECT set_config('request.jwt.claims', '{"role":"service_role"}', false);`;
const SERVICE_OFF = `SELECT set_config('request.jwt.claims', '', false);`;

function seedAccount(
  id: string,
  opts: { ageHours: number; completedLesson: boolean; startedLesson?: boolean }
): string {
  const progress = opts.completedLesson
    ? `INSERT INTO public.user_progress (user_id, course_id, lesson_id, completed, completed_at)
       VALUES ('${id}', 'course-1', 'lesson-1', true, now());`
    : opts.startedLesson
      ? `INSERT INTO public.user_progress (user_id, course_id, lesson_id, completed)
         VALUES ('${id}', 'course-1', 'lesson-1', false);`
      : "";
  return `
    INSERT INTO auth.users (id, email) VALUES ('${id}', '${id}@example.com');
    UPDATE public.profiles
       SET created_at = now() - make_interval(hours => ${opts.ageHours})
     WHERE id = '${id}';
    ${progress}
  `;
}

interface Caps {
  accountSoft: number;
  accountHard: number;
  ipSoft: number;
  ipHard: number;
  globalSoft: number;
  globalHard: number;
  newcomerSoft: number;
  newcomerHard: number;
}

// Large enough that a test only binds on the caps it lowers.
const OPEN: Caps = {
  accountSoft: 1e9,
  accountHard: 1e9,
  ipSoft: 1e9,
  ipHard: 1e9,
  globalSoft: 1e9,
  globalHard: 1e9,
  newcomerSoft: 1e9,
  newcomerHard: 1e9,
};

interface Reserved {
  decision: "full" | "degraded" | "denied";
  reserved_micro_usd: number;
  reserved_day: string;
  low_trust: boolean;
}

let db: PGlite;

async function reserve(
  userId: string,
  ip: string,
  full: number,
  degraded: number,
  caps: Partial<Caps> = {}
): Promise<Reserved> {
  const c = { ...OPEN, ...caps };
  const { rows } = await db.query<{
    decision: Reserved["decision"];
    reserved_micro_usd: string | number;
    reserved_day: Date | string;
    low_trust: boolean;
  }>(
    `SELECT * FROM public.reserve_ai_spend(
       $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      userId,
      ip,
      full,
      degraded,
      c.accountSoft,
      c.accountHard,
      c.ipSoft,
      c.ipHard,
      c.globalSoft,
      c.globalHard,
      c.newcomerSoft,
      c.newcomerHard,
    ]
  );
  const row = rows[0]!;
  return {
    decision: row.decision,
    reserved_micro_usd: Number(row.reserved_micro_usd),
    reserved_day:
      row.reserved_day instanceof Date
        ? row.reserved_day.toISOString().slice(0, 10)
        : String(row.reserved_day),
    low_trust: row.low_trust,
  };
}

async function settle(
  userId: string,
  ip: string,
  r: Reserved,
  actual: number,
  billed: boolean
): Promise<void> {
  await db.query(
    `SELECT public.settle_ai_spend($1::uuid, $2, $3::date, $4, $5, $6, $7)`,
    [
      userId,
      ip,
      r.reserved_day,
      r.low_trust,
      r.reserved_micro_usd,
      actual,
      billed,
    ]
  );
}

async function bucket(
  scope: string,
  key: string
): Promise<{ micro: number; requests: number }> {
  const { rows } = await db.query<{
    micro_usd: string | number;
    request_count: number;
  }>(
    `SELECT micro_usd, request_count FROM public.ai_spend_ledger
      WHERE scope = $1 AND scope_key = $2
        AND spend_day = (now() AT TIME ZONE 'America/Sao_Paulo')::date`,
    [scope, key]
  );
  if (!rows[0]) return { micro: 0, requests: 0 };
  return {
    micro: Number(rows[0].micro_usd),
    requests: Number(rows[0].request_count),
  };
}

beforeAll(async () => {
  db = await buildFullLineage();
  await db.exec(`
    ${SERVICE_ON}
    ${seedAccount(ESTABLISHED, { ageHours: 72, completedLesson: true })}
    ${seedAccount(ESTABLISHED_2, { ageHours: 72, completedLesson: true })}
    ${seedAccount(OLD_NO_LESSON, { ageHours: 72, completedLesson: false, startedLesson: true })}
    ${seedAccount(FRESH_WITH_LESSON, { ageHours: 2, completedLesson: true })}
    ${FRESH.map((id) => seedAccount(id, { ageHours: 0, completedLesson: false })).join("\n")}
    ${SERVICE_OFF}
  `);
}, 120_000);

afterAll(async () => {
  await db?.close();
});

beforeEach(async () => {
  await db.exec("RESET ROLE; TRUNCATE public.ai_spend_ledger;");
});

describe("low-trust classification", () => {
  it("is computed from the account's own rows", async () => {
    expect((await reserve(ESTABLISHED, "ip-a", 1, 1)).low_trust).toBe(false);
    expect((await reserve(OLD_NO_LESSON, "ip-a", 1, 1)).low_trust).toBe(true);
    expect((await reserve(FRESH_WITH_LESSON, "ip-a", 1, 1)).low_trust).toBe(
      true
    );
    expect((await reserve(FRESH[0]!, "ip-a", 1, 1)).low_trust).toBe(true);
    expect((await reserve(NO_PROFILE, "ip-a", 1, 1)).low_trust).toBe(true);
  });

  it("flips once a day-old account has a completed lesson", async () => {
    const id = "66666666-6666-4666-8666-666666666666";
    await db.exec(`
      ${SERVICE_ON}
      ${seedAccount(id, { ageHours: 30, completedLesson: false })}
      ${SERVICE_OFF}
    `);
    expect((await reserve(id, "ip-a", 1, 1)).low_trust).toBe(true);
    await db.exec(`
      ${SERVICE_ON}
      INSERT INTO public.user_progress (user_id, course_id, lesson_id, completed, completed_at)
      VALUES ('${id}', 'course-1', 'lesson-1', true, now());
      ${SERVICE_OFF}
    `);
    expect((await reserve(id, "ip-a", 1, 1)).low_trust).toBe(false);
  });
});

describe("newcomer pool", () => {
  it("fills and then denies only low-trust accounts; an established learner is still served", async () => {
    const caps = { newcomerSoft: 1000, newcomerHard: 1000 };

    const a = await reserve(FRESH[0]!, "ip-1", 400, 300, caps);
    const b = await reserve(FRESH[1]!, "ip-2", 400, 300, caps);
    expect(a.decision).toBe("full");
    expect(b.decision).toBe("full");
    expect(await bucket("newcomer", "")).toMatchObject({ micro: 800 });

    // 800 + 400 and 800 + 300 both exceed 1000.
    const c = await reserve(FRESH[2]!, "ip-3", 400, 300, caps);
    expect(c).toMatchObject({ decision: "denied", reserved_micro_usd: 0 });
    const d = await reserve(OLD_NO_LESSON, "ip-4", 400, 300, caps);
    expect(d.decision).toBe("denied");

    const e = await reserve(ESTABLISHED, "ip-5", 400, 300, caps);
    expect(e).toMatchObject({
      decision: "full",
      reserved_micro_usd: 400,
      low_trust: false,
    });

    // The established learner's spend never touches the pool, but does count
    // toward the global cap. Denied attempts booked nothing.
    expect(await bucket("newcomer", "")).toMatchObject({ micro: 800 });
    expect(await bucket("global", "")).toMatchObject({ micro: 1200 });
    expect(await bucket("account", FRESH[2]!)).toMatchObject({ micro: 0 });
  });

  it("degrades a low-trust account once the pool passes its soft cap", async () => {
    const caps = { newcomerSoft: 500, newcomerHard: 1000 };
    await reserve(FRESH[0]!, "ip-1", 600, 300, caps);
    const next = await reserve(FRESH[1]!, "ip-2", 600, 300, caps);
    expect(next).toMatchObject({
      decision: "degraded",
      reserved_micro_usd: 300,
    });
    // The pool's soft cap does not degrade an established learner.
    const est = await reserve(ESTABLISHED, "ip-3", 600, 300, caps);
    expect(est.decision).toBe("full");
  });

  it("keeps a low-trust account under its own account cap", async () => {
    const caps = { accountHard: 500 };
    expect((await reserve(FRESH[0]!, "ip-1", 400, 400, caps)).decision).toBe(
      "full"
    );
    expect((await reserve(FRESH[0]!, "ip-1", 400, 400, caps)).decision).toBe(
      "denied"
    );
  });

  it("keeps a low-trust account under the IP and global caps", async () => {
    expect(
      (await reserve(FRESH[0]!, "shared-ip", 400, 400, { ipHard: 500 }))
        .decision
    ).toBe("full");
    expect(
      (await reserve(FRESH[1]!, "shared-ip", 400, 400, { ipHard: 500 }))
        .decision
    ).toBe("denied");
    expect(
      (await reserve(FRESH[2]!, "other-ip", 400, 400, { globalHard: 700 }))
        .decision
    ).toBe("denied");
  });
});

describe("reservation against the hard caps", () => {
  it("denies when the worst case would cross a hard cap, not only once it is reached", async () => {
    await reserve(ESTABLISHED, "ip-1", 800, 800, { globalHard: 1000 });
    const r = await reserve(ESTABLISHED_2, "ip-2", 400, 400, {
      globalHard: 1000,
    });
    expect(r.decision).toBe("denied");
  });

  it("falls back to the degraded amount when only that fits", async () => {
    await reserve(ESTABLISHED, "ip-1", 800, 800, { globalHard: 1000 });
    const r = await reserve(ESTABLISHED_2, "ip-2", 400, 150, {
      globalHard: 1000,
    });
    expect(r).toMatchObject({ decision: "degraded", reserved_micro_usd: 150 });
    expect(await bucket("global", "")).toMatchObject({ micro: 950 });
  });

  it("concurrent reservations never exceed the global hard cap", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        reserve(i % 2 ? ESTABLISHED : ESTABLISHED_2, `ip-${i}`, 100, 100, {
          globalHard: 1000,
        })
      )
    );
    expect(results.filter((r) => r.decision !== "denied")).toHaveLength(10);
    expect((await bucket("global", "")).micro).toBe(1000);
  });

  it("concurrent low-trust reservations never exceed the newcomer pool", async () => {
    const results = await Promise.all(
      FRESH.slice(0, 10).map((id, i) =>
        reserve(id, `ip-${i}`, 100, 100, { newcomerHard: 300 })
      )
    );
    expect(results.filter((r) => r.decision !== "denied")).toHaveLength(3);
    expect((await bucket("newcomer", "")).micro).toBe(300);
  });

  it("concurrent reservations from one account never exceed its account cap", async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        reserve(ESTABLISHED, `ip-${i}`, 250, 250, { accountHard: 1000 })
      )
    );
    expect(results.filter((r) => r.decision !== "denied")).toHaveLength(4);
    expect((await bucket("account", ESTABLISHED)).micro).toBe(1000);
  });
});

describe("settle", () => {
  it("books the actual cost and refunds the rest of the hold", async () => {
    const r = await reserve(FRESH[0]!, "ip-1", 1000, 500);
    expect(await bucket("global", "")).toMatchObject({ micro: 1000 });

    await settle(FRESH[0]!, "ip-1", r, 300, true);

    for (const [scope, key] of [
      ["account", FRESH[0]!],
      ["ip", "ip-1"],
      ["global", ""],
      ["newcomer", ""],
    ] as const) {
      expect(await bucket(scope, key)).toEqual({ micro: 300, requests: 1 });
    }
  });

  it("frees the headroom it refunds", async () => {
    const caps = { globalHard: 1000 };
    const r = await reserve(ESTABLISHED, "ip-1", 1000, 1000, caps);
    expect(
      (await reserve(ESTABLISHED_2, "ip-2", 500, 500, caps)).decision
    ).toBe("denied");
    await settle(ESTABLISHED, "ip-1", r, 200, true);
    expect(
      (await reserve(ESTABLISHED_2, "ip-2", 500, 500, caps)).decision
    ).toBe("full");
  });

  it("an established learner's settle leaves the newcomer pool alone", async () => {
    await reserve(FRESH[0]!, "ip-1", 400, 400);
    const r = await reserve(ESTABLISHED, "ip-2", 1000, 1000);
    await settle(ESTABLISHED, "ip-2", r, 100, true);
    expect(await bucket("newcomer", "")).toEqual({ micro: 400, requests: 0 });
    expect(await bucket("account", ESTABLISHED)).toEqual({
      micro: 100,
      requests: 1,
    });
  });

  it("books the excess when the actual cost is above the hold", async () => {
    const r = await reserve(ESTABLISHED, "ip-1", 1000, 1000);
    await settle(ESTABLISHED, "ip-1", r, 1500, true);
    expect(await bucket("global", "")).toEqual({ micro: 1500, requests: 1 });
  });

  it("a release (not billed) returns the whole hold and counts no request", async () => {
    const r = await reserve(FRESH[0]!, "ip-1", 1000, 500);
    await settle(FRESH[0]!, "ip-1", r, 0, false);
    expect(await bucket("global", "")).toEqual({ micro: 0, requests: 0 });
    expect(await bucket("newcomer", "")).toEqual({ micro: 0, requests: 0 });
  });

  it("never takes a bucket below zero", async () => {
    const r = await reserve(ESTABLISHED, "ip-1", 100, 100);
    await settle(
      ESTABLISHED,
      "ip-1",
      { ...r, reserved_micro_usd: 5000 },
      0,
      false
    );
    expect((await bucket("global", "")).micro).toBe(0);
  });

  it("settles on the day the hold was booked", async () => {
    const r = await reserve(ESTABLISHED, "ip-1", 1000, 1000);
    // Move the hold to yesterday, as if the day rolled over mid-call.
    await db.exec(
      `UPDATE public.ai_spend_ledger SET spend_day = spend_day - 1;`
    );
    const yesterday = new Date(`${r.reserved_day}T00:00:00Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    await settle(
      ESTABLISHED,
      "ip-1",
      { ...r, reserved_day: yesterday.toISOString().slice(0, 10) },
      250,
      true
    );
    const { rows } = await db.query<{ micro_usd: string | number }>(
      `SELECT micro_usd FROM public.ai_spend_ledger WHERE scope = 'global'`
    );
    expect(rows.map((x) => Number(x.micro_usd))).toEqual([250]);
  });
});

describe("bad input raises and books nothing", () => {
  const cases: Array<[string, () => Promise<unknown>]> = [
    [
      "a NULL cap",
      () =>
        db.query(
          `SELECT * FROM public.reserve_ai_spend($1::uuid, 'ip', 100, 100,
             NULL, 1000, 1000, 1000, 1000, 1000, 1000, 1000)`,
          [ESTABLISHED]
        ),
    ],
    [
      "a zero hard cap",
      () => reserve(ESTABLISHED, "ip", 100, 100, { globalHard: 0 }),
    ],
    ["a negative amount", () => reserve(ESTABLISHED, "ip", -100, -100)],
    [
      "a NULL amount",
      () =>
        db.query(
          `SELECT * FROM public.reserve_ai_spend($1::uuid, 'ip', NULL, 100,
             1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000)`,
          [ESTABLISHED]
        ),
    ],
  ];

  for (const [label, run] of cases) {
    it(`reserve with ${label}`, async () => {
      await expect(run()).rejects.toThrow();
      const { rows } = await db.query(`SELECT 1 FROM public.ai_spend_ledger`);
      expect(rows).toHaveLength(0);
    });
  }

  it("settle with a negative amount", async () => {
    const r = await reserve(ESTABLISHED, "ip-1", 1000, 1000);
    await expect(settle(ESTABLISHED, "ip-1", r, -5, true)).rejects.toThrow();
    expect((await bucket("global", "")).micro).toBe(1000);
  });
});

describe("migration hardening", () => {
  const FNS = [
    "public.reserve_ai_spend(uuid, text, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint)",
    "public.settle_ai_spend(uuid, text, date, boolean, bigint, bigint, boolean)",
  ];

  it("is SECURITY DEFINER with a fixed search_path", async () => {
    for (const fn of FNS) {
      const { rows } = await db.query<{
        prosecdef: boolean;
        proconfig: string[] | null;
      }>(
        `SELECT prosecdef, proconfig FROM pg_proc WHERE oid = $1::regprocedure`,
        [fn]
      );
      expect(rows[0]?.prosecdef, fn).toBe(true);
      expect(rows[0]?.proconfig, fn).toContain('search_path=""');
    }
  });

  it("is callable by service_role only", async () => {
    for (const fn of FNS) {
      for (const [role, allowed] of [
        ["anon", false],
        ["authenticated", false],
        ["service_role", true],
      ] as const) {
        const { rows } = await db.query<{ ok: boolean }>(
          `SELECT has_function_privilege($1, $2, 'EXECUTE') AS ok`,
          [role, fn]
        );
        expect(rows[0]?.ok, `${role} on ${fn}`).toBe(allowed);
      }
    }
  });

  it("accepts the newcomer scope and still rejects unknown ones", async () => {
    await db.exec(
      `INSERT INTO public.ai_spend_ledger (scope, scope_key, spend_day) VALUES ('newcomer', '', current_date);`
    );
    await expect(
      db.exec(
        `INSERT INTO public.ai_spend_ledger (scope, scope_key, spend_day) VALUES ('other', '', current_date);`
      )
    ).rejects.toThrow(/ai_spend_ledger_scope_check/);
  });

  it("re-applies cleanly", async () => {
    await expect(db.exec(readMigration(MIGRATION))).resolves.toBeDefined();
  });
});
