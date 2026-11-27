/**
 * The browser runner and the server executor are two harnesses over one
 * contract, so a learner who gets Run green must not get Submit rejected. Runs
 * the runner's real wrapper and worker source in place of a browser Worker, next
 * to the real executor, over common submission shapes and the shipped bundle.
 *
 * CI logs are public and the bundle holds the answer keys, so bundle assertions
 * name only lessons and test ids. Never assert on a raw result or `detail`.
 */
import { createContext, runInContext } from "node:vm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AdminTestCase, TestCase } from "@superteam-lms/types";
import { runJsSubmission } from "@/lib/challenge/executor";
import {
  FIXTURE_ISOLATION_SHAPES,
  SUBMISSION_SHAPES,
} from "@/lib/challenge/__tests__/fixtures/js-submission-shapes";
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

/** The same, in a vm context of its own, for code that replaces shared builtins. */
class ContextWorker extends InProcessWorker {
  override postMessage(message: unknown) {
    const self = {
      onmessage: null as ((e: { data: unknown }) => unknown) | null,
      postMessage: (data: unknown) => this.onmessage?.({ data }),
    };
    const context = createContext({ self, crypto });
    runInContext(WORKER_SOURCE, context);
    void self.onmessage?.({ data: message });
  }
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
      "a misplaced statement holding the verdict word",
      "function add() { return 0; }\nreturn 'pass';",
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

  it.each([
    ["transaction", "function go(t) { return 1; }", "result === 1", true],
    ["result", "function go(r) { return 1; }", "result === 1", true],
    ["publicKey", "function go() { return 1; }", "!!publicKey", false],
    ["isValid", "function go() { return 1; }", "!!isValid", false],
    ["mintInfo", "function go() { return 1; }", "!!mintInfo", false],
    ["lamports", "function go() { return 1; }", "lamports === undefined", true],
  ])(
    "both read an assertion's own %s over a fixture of that name",
    async (input, code, expectedOutput, passes) => {
      const tests: AdminTestCase[] = [
        { id: "t", description: "", input, expectedOutput },
      ];
      const expected = passes ? [] : ["t"];
      expect(await failedInBrowser(code, tests)).toEqual(expected);
      expect(await failedOnServer(code, tests)).toEqual(expected);
    }
  );

  it.each(FIXTURE_ISOLATION_SHAPES)(
    "both keep an assertion's fixtures apart from $name",
    async ({ code, test, passes }) => {
      const expected = passes ? [] : [test.id];
      vi.stubGlobal("Worker", ContextWorker);
      try {
        expect(await failedInBrowser(code, [test])).toEqual(expected);
      } finally {
        vi.stubGlobal("Worker", InProcessWorker);
      }
      expect(await failedOnServer(code, [test])).toEqual(expected);
    }
  );

  it("both read a fixture over a learner binding of the same name", async () => {
    const code = "const data = 3;\nfunction len(d) { return d.length + data; }";
    const tests: AdminTestCase[] = [
      {
        id: "t",
        description: "",
        input: "data",
        expectedOutput: "result === data.length + 3",
      },
    ];
    expect(await failedInBrowser(code, tests)).toEqual([]);
    expect(await failedOnServer(code, tests)).toEqual([]);
  });

  it("both keep a learner's bindings out of the assertion", async () => {
    const code = "const helper = 1;\nfunction go() { return 1; }";
    const tests: AdminTestCase[] = [
      {
        id: "t",
        description: "",
        input: "",
        expectedOutput: "typeof helper === 'number'",
      },
    ];
    expect(await failedInBrowser(code, tests)).toEqual(["t"]);
    expect(await failedOnServer(code, tests)).toEqual(["t"]);
  });

  const sdkImport =
    'import { Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";\n';
  it.each([
    [
      "a class check against PublicKey",
      "payer",
      "function go(k) { return k; }",
      "result instanceof PublicKey",
    ],
    [
      "a new PublicKey",
      "",
      "function go() { return new PublicKey(new Uint8Array(32)); }",
      "result.equals(new PublicKey(new Uint8Array(32)))",
    ],
    [
      "a class check against Transaction",
      "sender, recipient",
      "function go(from, to) { return new Transaction().add(SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports: LAMPORTS_PER_SOL })); }",
      "result instanceof Transaction && result.instructions.length === 1",
    ],
    [
      "Keypair.fromSecretKey",
      "",
      "function go() { return Keypair.generate(); }",
      "Keypair.fromSecretKey(result.secretKey).secretKey.length === 64",
    ],
  ])(
    "both give an assertion the SDK for %s",
    async (_label, input, code, expectedOutput) => {
      const tests: AdminTestCase[] = [
        { id: "t", description: "", input, expectedOutput },
      ];
      expect(await failedInBrowser(sdkImport + code, tests)).toEqual([]);
      expect(await failedOnServer(sdkImport + code, tests)).toEqual([]);
    }
  );

  it("both give an assertion the SDK as it was before the submission ran", async () => {
    const code = `${sdkImport}function go() {
  const key = new PublicKey(new Uint8Array(32));
  __modules__["@solana/web3.js"].PublicKey = class {};
  return key;
}`;
    const tests: AdminTestCase[] = [
      {
        id: "t",
        description: "",
        input: "",
        expectedOutput: "result instanceof PublicKey",
      },
    ];
    expect(await failedInBrowser(code, tests)).toEqual([]);
    expect(await failedOnServer(code, tests)).toEqual([]);
  });

  it("both give an assertion the SDK when the submission doesn't import it", async () => {
    const tests: AdminTestCase[] = [
      {
        id: "t",
        description: "",
        input: "",
        expectedOutput: "typeof Keypair.generate === 'function'",
      },
    ];
    expect(await failedInBrowser("function go() { return 1; }", tests)).toEqual(
      []
    );
    expect(await failedOnServer("function go() { return 1; }", tests)).toEqual(
      []
    );
  });

  it("both let a fixture named like an SDK export shadow it", async () => {
    const tests: AdminTestCase[] = [
      {
        id: "t",
        description: "",
        input: "Keypair",
        expectedOutput:
          "typeof Keypair === 'object' && Keypair.generate === undefined",
      },
    ];
    expect(
      await failedInBrowser("function go(k) { return 1; }", tests)
    ).toEqual([]);
    expect(await failedOnServer("function go(k) { return 1; }", tests)).toEqual(
      []
    );
  });

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
