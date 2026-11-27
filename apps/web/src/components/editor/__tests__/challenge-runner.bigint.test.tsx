// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { TestCase } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { ChallengeRunner } from "../challenge-runner";
import type { ExecutionResult } from "../types";

vi.mock("@/lib/build-server/client", () => ({ buildProgram: vi.fn() }));
vi.mock("@superteam-lms/deploy", () => ({ setCachedBinary: vi.fn() }));

/** jsdom has no Worker. This one runs the runner's real worker source in place. */
class InlineWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  terminate() {}
  postMessage(data: unknown) {
    const onMessage = (event: { data: unknown }) => this.onmessage?.(event);
    void workerSource.then((source) => {
      const self: { onmessage?: (e: { data: unknown }) => void } & {
        postMessage: (data: unknown) => void;
      } = { postMessage: (out) => onMessage({ data: out }) };
      new Function("self", source)(self);
      self.onmessage?.({ data });
    });
  }
}

let workerSource: Promise<string>;

beforeEach(() => {
  vi.stubGlobal("Worker", InlineWorker);
  URL.createObjectURL = (blob: Blob | MediaSource) => {
    const file = blob as Blob;
    workerSource = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(file);
    });
    return "blob:worker";
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const tests: TestCase[] = [
  {
    id: "t1",
    description: "returns the amount",
    input: "",
    expectedOutput: "result.amount === 5n",
  },
];

async function run(code: string): Promise<ExecutionResult> {
  const onResult = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeRunner
        getCode={() => code}
        tests={tests}
        language="typescript"
        onResult={onResult}
        onSubmit={() => {}}
        isComplete={false}
        xpReward={50}
      />
    </NextIntlClientProvider>
  );
  fireEvent.click(screen.getByRole("button", { name: /Run Code/ }));
  await waitFor(() => expect(onResult).toHaveBeenCalled(), { timeout: 4000 });
  return onResult.mock.calls[0]![0] as ExecutionResult;
}

describe("ChallengeRunner with a BigInt", () => {
  it("prints a returned BigInt instead of reporting a run error", async () => {
    const result = await run(
      "async function solve() { return { amount: 5n }; }"
    );
    expect(result.error).toBeUndefined();
    expect(result.output).toContain("5n");
    expect(result.success).toBe(true);
  });

  it.each([
    ["an array", "console.log([7n]);", "7n"],
    ["console.error", "console.error({ amount: 7n });", "7n"],
    ["a bare BigInt", "console.log(7n);", "7n"],
    ["a circular object", "const a = {}; a.self = a; console.log(a);", ""],
    [
      "an object that can't become a string",
      "const a = Object.create(null); a.self = a; console.log(a);",
      "",
    ],
  ])("keeps the run clean when logging %s", async (_name, logging, printed) => {
    const result = await run(
      `async function solve() { ${logging} return { amount: 5n }; }`
    );
    expect(result.error).toBeUndefined();
    expect(result.output).toContain(printed);
    expect(result.success).toBe(true);
  });

  it("logs an object holding a BigInt", async () => {
    const result = await run(
      "async function solve() { console.log({ amount: 7n }); return { amount: 5n }; }"
    );
    expect(result.error).toBeUndefined();
    expect(result.output).toContain("7n");
  });
});
