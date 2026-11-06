/**
 * The browser runner and the server executor are two harnesses over one
 * contract, so a learner who gets Run green must not get Submit rejected. Runs
 * the runner's real wrapper and worker source in place of a browser Worker, next
 * to the real executor, over common submission shapes and the shipped bundle.
 *
 * CI logs are public and the bundle holds the answer keys, so bundle assertions
 * name only lessons and test ids. Never assert on a raw result or `detail`.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AdminTestCase, TestCase } from "@superteam-lms/types";
import { runJsSubmission } from "@/lib/challenge/executor";
import { SUBMISSION_SHAPES } from "@/lib/challenge/__tests__/fixtures/js-submission-shapes";
import { lessonsById } from "@/lib/content/store";
import { runTestCase, WORKER_SOURCE } from "../challenge-runner";

vi.mock("server-only", () => ({}));

interface RawBlock {
  _type: string;
  _key?: string;
  language?: string;
  buildType?: string | null;
  starter?: string;
  solution?: string;
  tests?: AdminTestCase[];
}

/** Runs WORKER_SOURCE as a worker would, on the same message protocol. */
class InProcessWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: ((e: { message: string }) => void) | null = null;

  postMessage(message: unknown) {
    const self = {
      onmessage: null as ((e: { data: unknown }) => unknown) | null,
      postMessage: (data: unknown) => this.onmessage?.({ data }),
    };
    new Function("self", WORKER_SOURCE)(self);
    void self.onmessage?.({ data: message });
  }

  terminate() {}
}

const translate = ((key: string) => key) as unknown as Parameters<
  typeof runTestCase
>[0];

const failedInBrowser = async (code: string, tests: AdminTestCase[]) => {
  const results = await Promise.all(
    tests.map((test) =>
      runTestCase(translate, code, test as TestCase).catch(() => ({
        testCase: test,
        passed: false,
      }))
    )
  );
  return results.filter((r) => !r.passed).map((r) => r.testCase.id);
};

const failedOnServer = async (code: string, tests: AdminTestCase[]) => {
  const run = await runJsSubmission(code, tests);
  if (!run.available) throw new Error("executor unavailable");
  return run.results.filter((r) => !r.passed).map((r) => r.id);
};

beforeAll(() => {
  vi.stubGlobal("Worker", InProcessWorker);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("browser runner and server executor", () => {
  it.each(SUBMISSION_SHAPES)("both pass $name", async ({ code, tests }) => {
    expect(await failedInBrowser(code, tests)).toEqual([]);
    expect(await failedOnServer(code, tests)).toEqual([]);
  });

  it.each([
    ["a wrong answer", "function add(a, b) { return a - b; }", "result === 5"],
    [
      "a throwing function",
      "function add() { throw new Error('x'); }",
      "result === 5",
    ],
    ["a wrong type", "function add() { return '5'; }", "result === 5"],
    ["no function", "const five = 5;", "result === 5"],
    ["a syntax error", "function add( {", "result === 5"],
    [
      "an assertion that isn't a boolean",
      "function add() { return 5; }",
      "result",
    ],
    [
      "an assertion that yields a string",
      "function add() { return 'pass'; }",
      "result",
    ],
    [
      "a misplaced statement",
      "function add() { return 0; }\nreturn 1;",
      "result === 5",
    ],
    [
      "a misplaced statement behind a branch",
      "function add() { return 0; }\nif (1) return 1;",
      "result === 5",
    ],
  ])("both fail %s", async (_label, code, expectedOutput) => {
    const tests: AdminTestCase[] = [
      { id: "t", description: "", input: "2, 3", expectedOutput },
    ];
    expect(await failedInBrowser(code, tests)).toEqual(["t"]);
    expect(await failedOnServer(code, tests)).toEqual(["t"]);
  });

  it.each([
    [
      "a changed field",
      "position",
      "function go(p) { p.debt = 1; return 1; }",
      "position.debt === result",
    ],
    [
      "a changed byte",
      "data",
      "function go(d) { d[0] = 9; return 9; }",
      "data[0] === result",
    ],
    [
      "identity with a fixture",
      "position",
      "function go(p) { return p; }",
      "result === position",
    ],
    [
      "identity with a fixture's key",
      "payer",
      "function go(pk) { return pk; }",
      "result === payer.publicKey",
    ],
  ])(
    "both read fixtures as the test built them: %s",
    async (_label, input, code, expectedOutput) => {
      const tests: AdminTestCase[] = [
        { id: "t", description: "", input, expectedOutput },
      ];
      expect(await failedInBrowser(code, tests)).toEqual(["t"]);
      expect(await failedOnServer(code, tests)).toEqual(["t"]);
    }
  );

  it("both match a fixture's value and key by content", async () => {
    const tests: AdminTestCase[] = [
      {
        id: "a",
        description: "",
        input: "position",
        expectedOutput: "result.debt === position.debt",
      },
      {
        id: "b",
        description: "",
        input: "payer",
        expectedOutput: "result.equals(payer.publicKey)",
      },
    ];
    const code = "function go(x) { return x; }";
    expect(await failedInBrowser(code, tests)).toEqual([]);
    expect(await failedOnServer(code, tests)).toEqual([]);
  });

  it("agree when a learner binding shares a fixture's name", async () => {
    const code = "const data = 3;\nfunction len(d) { return d.length + data; }";
    const tests: AdminTestCase[] = [
      {
        id: "t",
        description: "",
        input: "data",
        expectedOutput: "result === 18",
      },
    ];
    expect(await failedInBrowser(code, tests)).toEqual([]);
    expect(await failedOnServer(code, tests)).toEqual([]);
  });
});

describe("TypeScript blocks in the shipped bundle", () => {
  const cases = [...lessonsById.values()].flatMap((lesson) =>
    ((lesson.blocks ?? []) as RawBlock[])
      .filter(
        (b) =>
          b._type === "code" &&
          b.language !== "rust" &&
          b.buildType !== "buildable"
      )
      .map((block) => ({ id: `${lesson._id}/${block._key}`, block }))
  );

  it("finds blocks to run", () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  it.each(cases)(
    "$id: the browser runner passes the solution on every test",
    async ({ block }) => {
      expect(
        await failedInBrowser(block.solution ?? "", block.tests ?? [])
      ).toEqual([]);
    },
    30_000
  );

  it.each(cases)(
    "$id: the browser runner fails the starter",
    async ({ block }) => {
      expect(
        (await failedInBrowser(block.starter ?? "", block.tests ?? [])).length
      ).toBeGreaterThan(0);
    },
    30_000
  );
});
