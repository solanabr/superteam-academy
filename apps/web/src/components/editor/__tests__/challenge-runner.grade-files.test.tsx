// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { TestCase } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import {
  buildGradeFiles,
  HARNESS_MARKER,
  LIB_PATH,
  VERIFY_PATH,
} from "@/lib/challenge/harness";
import { ChallengeRunner } from "../challenge-runner";

const h = vi.hoisted(() => ({ buildProgram: vi.fn() }));

vi.mock("@/lib/build-server/client", () => ({ buildProgram: h.buildProgram }));
vi.mock("@superteam-lms/deploy", () => ({ setCachedBinary: vi.fn() }));

const STARTER = [
  "use anchor_lang::prelude::*;",
  'declare_id!("Fg6");',
  "// TODO (p1): add the `ping` handler here.",
  "// ─────",
  HARNESS_MARKER,
  "mod verify {",
  "    const PING: fn() = first_program::ping;",
  "}",
  "",
].join("\n");

/** The bypass shape: harness deleted, trailing attribute to eat what follows. */
const CODE = 'declare_id!("Fg6");\npub fn nothing() {}\n\n#[cfg(any())]\n';

const tests: TestCase[] = [
  {
    id: "t1",
    description: "Program compiles successfully",
    input: "",
    expectedOutput: "true",
  },
];

beforeEach(() => {
  h.buildProgram.mockReset();
  h.buildProgram.mockResolvedValue({ success: true, stderr: "", uuid: "u" });
});

describe("browser runner sends the same file layout as the server grader", () => {
  it("matches buildGradeFiles, only declare_id! and the nonce differ", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ChallengeRunner
          code={CODE}
          starter={STARTER}
          tests={tests}
          language="rust"
          buildType="buildable"
          onResult={() => {}}
          onSubmit={() => {}}
          isComplete={false}
          xpReward={50}
        />
      </NextIntlClientProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(h.buildProgram).toHaveBeenCalled());

    const sent = (
      h.buildProgram.mock.calls[0]![0] as {
        files: { path: string; content: string }[];
      }
    ).files;
    const expected = buildGradeFiles(CODE, STARTER);

    // Same paths, same order, plus the client's cache-busting nonce file.
    expect(sent.map((f) => f.path)).toEqual([
      LIB_PATH,
      VERIFY_PATH,
      "/src/_nonce.rs",
    ]);
    // The harness module is byte-identical to the server's.
    expect(sent[1]!.content).toBe(expected[1]![1]);
    // lib.rs differs only where the client pins the generated program id.
    const normalise = (s: string) =>
      s.replace(/declare_id!\s*\(\s*"[^"]*"\s*\)/, 'declare_id!("")');
    expect(normalise(sent[0]!.content)).toBe(normalise(expected[0]![1]));
    expect(sent[0]!.content).toContain("mod _verify;");
  });
});
