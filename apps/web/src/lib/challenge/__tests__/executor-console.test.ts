import { describe, it, expect, vi } from "vitest";
import type { AdminTestCase } from "@superteam-lms/types";
import { isExecutorAvailable, runJsSubmission } from "../executor";

vi.mock("server-only", () => ({}));

const EXECUTOR_AVAILABLE = await isExecutorAvailable();

const tests: AdminTestCase[] = [
  {
    id: "t1",
    description: "returns the amount",
    input: "",
    expectedOutput: "result.amount === 5n",
  },
];

const solve = (logging: string, amount = "5n") =>
  `async function solve() { ${logging} return { amount: ${amount} }; }`;

describe.skipIf(!EXECUTOR_AVAILABLE)("logging never changes a verdict", () => {
  it.each([
    ["an object holding a BigInt", "console.log({ amount: 7n });"],
    ["console.error", "console.error({ amount: 7n });"],
    ["console.warn and info", "console.warn([7n]); console.info([[7n]]);"],
    ["an array holding a BigInt", "console.log([1n, 2n]);"],
    ["a bare BigInt", "console.log(7n);"],
    ["a circular object", "const a = {}; a.self = a; console.log(a);"],
    [
      "an object that can't become a string",
      "const a = Object.create(null); a.self = a; console.log(a);",
    ],
    [
      "a getter that throws",
      "console.log({ get bad() { throw new Error('no'); } });",
    ],
  ])("passes a correct solution logging %s", async (_name, logging) => {
    const run = await runJsSubmission(solve(logging), tests);
    expect(run.available && run.passed).toBe(true);
  });

  it("still fails a wrong solution that logs a BigInt", async () => {
    const run = await runJsSubmission(
      solve("console.log({ amount: 7n });", "6n"),
      tests
    );
    expect(run.available && run.passed).toBe(false);
  });
});
