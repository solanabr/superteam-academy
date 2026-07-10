/* eslint-disable import/order -- vi.mock must precede importing the grader. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SubmissionRunResult } from "@/lib/challenge/executor";

vi.mock("server-only", () => ({}));

const isExecutorAvailable = vi.fn<() => Promise<boolean>>();
const runJsSubmission = vi.fn<() => Promise<SubmissionRunResult>>();
const runRustSubmission = vi.fn<() => Promise<SubmissionRunResult>>();
const runBuildableSubmission = vi.fn<() => Promise<SubmissionRunResult>>();

vi.mock("@/lib/challenge/executor", () => ({
  isExecutorAvailable: () => isExecutorAvailable(),
  runJsSubmission: () => runJsSubmission(),
}));
vi.mock("@/lib/challenge/rust-executor", () => ({
  runRustSubmission: () => runRustSubmission(),
}));
vi.mock("@/lib/challenge/buildable-executor", () => ({
  runBuildableSubmission: () => runBuildableSubmission(),
}));

import { gradeCode } from "../graders/code";

const tests = [
  { id: "t1", description: "adds", input: "1 2", expectedOutput: "3" },
];
const jsBlock = {
  _type: "code" as const,
  key: "c",
  language: "typescript" as const,
  buildType: "standard" as const,
  starter: "x",
  solution: "y",
  tests,
};

beforeEach(() => {
  isExecutorAvailable.mockReset();
  runJsSubmission.mockReset();
  runRustSubmission.mockReset();
  runBuildableSubmission.mockReset();
});

describe("gradeCode", () => {
  it("ok when the isolate passes every test", async () => {
    isExecutorAvailable.mockResolvedValue(true);
    runJsSubmission.mockResolvedValue({
      available: true,
      passed: true,
      results: [],
    });
    expect(await gradeCode(jsBlock, { code: "solution" })).toEqual({
      ok: true,
    });
  });

  it("403 when the isolate runs but a test fails", async () => {
    isExecutorAvailable.mockResolvedValue(true);
    runJsSubmission.mockResolvedValue({
      available: true,
      passed: false,
      results: [],
    });
    expect(await gradeCode(jsBlock, { code: "wrong" })).toEqual({
      ok: false,
      status: 403,
    });
  });

  it("503 when the isolate is unavailable (degrade closed)", async () => {
    isExecutorAvailable.mockResolvedValue(false);
    expect(await gradeCode(jsBlock, { code: "x" })).toEqual({
      ok: false,
      status: 503,
    });
    expect(runJsSubmission).not.toHaveBeenCalled();
  });

  it("503 when the isolate run reports unavailable", async () => {
    isExecutorAvailable.mockResolvedValue(true);
    runJsSubmission.mockResolvedValue({
      available: false,
      reason: "executor_unavailable",
    });
    expect(await gradeCode(jsBlock, { code: "x" })).toEqual({
      ok: false,
      status: 503,
    });
  });

  it("routes rust to the Rust executor", async () => {
    runRustSubmission.mockResolvedValue({
      available: true,
      passed: true,
      results: [],
    });
    const rustBlock = { ...jsBlock, language: "rust" as const };
    expect(await gradeCode(rustBlock, { code: "fn main(){}" })).toEqual({
      ok: true,
    });
    expect(runRustSubmission).toHaveBeenCalled();
    expect(runJsSubmission).not.toHaveBeenCalled();
  });

  it("routes buildable to the build server", async () => {
    runBuildableSubmission.mockResolvedValue({
      available: true,
      passed: true,
      results: [],
    });
    const buildable = {
      ...jsBlock,
      language: "rust" as const,
      buildType: "buildable" as const,
    };
    expect(await gradeCode(buildable, { code: "..." })).toEqual({ ok: true });
    expect(runBuildableSubmission).toHaveBeenCalled();
  });

  it("403 on a missing/empty submission", async () => {
    expect(await gradeCode(jsBlock, {})).toEqual({ ok: false, status: 403 });
    expect(await gradeCode(jsBlock, { code: "" })).toEqual({
      ok: false,
      status: 403,
    });
  });

  it("503 on an unrecognised language (fail closed)", async () => {
    const weird = {
      ...jsBlock,
      language: "brainfuck" as unknown as "typescript",
    };
    expect(await gradeCode(weird, { code: "x" })).toEqual({
      ok: false,
      status: 503,
    });
  });
});
