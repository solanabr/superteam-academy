import { describe, it, expect } from "vitest";
import {
  MAX_DIAGNOSTICS,
  MAX_DIAGNOSTIC_CODE_CHARS,
  MAX_DIAGNOSTIC_MESSAGE_CHARS,
  MAX_DIAGNOSTIC_PATH_CHARS,
} from "../diagnostics";
import { MAX_REJECTED_MESSAGE_CHARS, readBuildServerAnswer } from "../failure";

/** Two entries as the build server sends them. */
const ERROR = {
  file: "/src/lib.rs",
  line: 2,
  col: 5,
  end_line: 2,
  end_col: 9,
  level: "error",
  code: "E0425",
  message: "cannot find function `ping` in this scope",
};

const WARNING = {
  file: "/src/lib.rs",
  line: 2,
  col: 9,
  end_line: 2,
  end_col: 15,
  level: "warning",
  code: null,
  message: "unused variable: `unused`",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function text(status: number, body = "<html>page</html>"): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html" },
  });
}

describe("readBuildServerAnswer: a 200", () => {
  it("is a verdict when the body has the build result shape", async () => {
    expect(
      await readBuildServerAnswer(
        json(200, {
          success: true,
          stderr: "",
          uuid: "u1",
          idl: null,
          binary_b64: "AAAA",
        })
      )
    ).toEqual({
      kind: "verdict",
      verdict: {
        success: true,
        stderr: "",
        uuid: "u1",
        binary_b64: "AAAA",
        diagnostics: [],
      },
    });
  });

  it("is a verdict for a compile failure, which has no uuid or binary", async () => {
    expect(
      await readBuildServerAnswer(
        json(200, { success: false, stderr: "error[E0425]", idl: null })
      )
    ).toEqual({
      kind: "verdict",
      verdict: {
        success: false,
        stderr: "error[E0425]",
        uuid: null,
        diagnostics: [],
      },
    });
  });

  it("carries the diagnostics of a passing build", async () => {
    expect(
      await readBuildServerAnswer(
        json(200, {
          success: true,
          stderr: "warning: unused variable: `unused`",
          diagnostics: [WARNING],
          uuid: "u1",
          idl: null,
          binary_b64: "AAAA",
        })
      )
    ).toEqual({
      kind: "verdict",
      verdict: {
        success: true,
        stderr: "warning: unused variable: `unused`",
        uuid: "u1",
        binary_b64: "AAAA",
        diagnostics: [
          {
            file: "/src/lib.rs",
            line: 2,
            col: 9,
            endLine: 2,
            endCol: 15,
            level: "warning",
            code: null,
            message: "unused variable: `unused`",
          },
        ],
      },
    });
  });

  it("carries the diagnostics of a failed build", async () => {
    expect(
      await readBuildServerAnswer(
        json(200, {
          success: false,
          stderr: "error[E0425]",
          diagnostics: [ERROR, WARNING],
          idl: null,
        })
      )
    ).toEqual({
      kind: "verdict",
      verdict: {
        success: false,
        stderr: "error[E0425]",
        uuid: null,
        diagnostics: [
          {
            file: "/src/lib.rs",
            line: 2,
            col: 5,
            endLine: 2,
            endCol: 9,
            level: "error",
            code: "E0425",
            message: "cannot find function `ping` in this scope",
          },
          expect.objectContaining({ level: "warning" }),
        ],
      },
    });
  });

  it("has no diagnostics when the field is missing or empty", async () => {
    for (const body of [
      { success: true, stderr: "", uuid: "u1" },
      { success: true, stderr: "", diagnostics: [], uuid: "u1" },
    ]) {
      expect(await readBuildServerAnswer(json(200, body))).toEqual({
        kind: "verdict",
        verdict: { success: true, stderr: "", uuid: "u1", diagnostics: [] },
      });
    }
  });

  it("passes on only the fields of a diagnostic", async () => {
    const answer = await readBuildServerAnswer(
      json(200, {
        success: false,
        stderr: "",
        diagnostics: [{ ...ERROR, html: "<b>x</b>", children: [ERROR] }],
      })
    );

    expect(answer.kind).toBe("verdict");
    if (answer.kind === "verdict") {
      expect(Object.keys(answer.verdict.diagnostics[0]!).sort()).toEqual([
        "code",
        "col",
        "endCol",
        "endLine",
        "file",
        "level",
        "line",
        "message",
      ]);
    }
  });

  it("accepts a list and fields at the server's limits", async () => {
    const atLimit = {
      ...ERROR,
      file: `/src/${"a".repeat(MAX_DIAGNOSTIC_PATH_CHARS - 8)}.rs`,
      code: "c".repeat(MAX_DIAGNOSTIC_CODE_CHARS),
      // The server counts characters, so one outside the BMP counts once.
      message: "\u{1F600}".repeat(MAX_DIAGNOSTIC_MESSAGE_CHARS),
      line: 2 ** 32 - 1,
      end_line: 2 ** 32 - 1,
      end_col: 5,
    };
    const answer = await readBuildServerAnswer(
      json(200, {
        success: false,
        stderr: "",
        diagnostics: Array.from({ length: MAX_DIAGNOSTICS }, () => atLimit),
      })
    );

    expect(answer.kind).toBe("verdict");
    if (answer.kind === "verdict") {
      expect(answer.verdict.diagnostics).toHaveLength(MAX_DIAGNOSTICS);
    }
  });

  it.each<[string, unknown]>([
    ["not an array", { 0: ERROR }],
    ["a string", "error"],
    ["null", null],
    [
      "more entries than the server sends",
      Array(MAX_DIAGNOSTICS + 1).fill(ERROR),
    ],
    ["an entry that is not an object", [ERROR, "error"]],
    ["a null entry", [null]],
    ["an array entry", [[ERROR]]],
    ["a missing field", [{ ...ERROR, message: undefined }]],
    ["a non-string file", [{ ...ERROR, file: 1 }]],
    ["an empty file", [{ ...ERROR, file: "" }]],
    [
      "a file path over the cap",
      [{ ...ERROR, file: `/src/${"a".repeat(MAX_DIAGNOSTIC_PATH_CHARS)}.rs` }],
    ],
    ["a line of zero", [{ ...ERROR, line: 0 }]],
    ["a negative column", [{ ...ERROR, col: -1 }]],
    ["a fractional line", [{ ...ERROR, line: 2.5, end_line: 3 }]],
    ["a numeric string", [{ ...ERROR, line: "2" }]],
    ["a line past 32 bits", [{ ...ERROR, line: 2 ** 32, end_line: 2 ** 32 }]],
    ["a missing end", [{ ...ERROR, end_col: undefined }]],
    ["an end line before the start", [{ ...ERROR, line: 3, end_line: 2 }]],
    ["an end column before the start", [{ ...ERROR, col: 9, end_col: 5 }]],
    ["an unknown level", [{ ...ERROR, level: "note" }]],
    ["a numeric code", [{ ...ERROR, code: 425 }]],
    ["an empty code", [{ ...ERROR, code: "" }]],
    [
      "a code over the cap",
      [{ ...ERROR, code: "c".repeat(MAX_DIAGNOSTIC_CODE_CHARS + 1) }],
    ],
    ["a non-string message", [{ ...ERROR, message: { text: "x" } }]],
    ["an empty message", [{ ...ERROR, message: "" }]],
    [
      "a message over the cap",
      [{ ...ERROR, message: "m".repeat(MAX_DIAGNOSTIC_MESSAGE_CHARS + 1) }],
    ],
    ["one bad entry among good ones", [ERROR, { ...ERROR, line: 0 }, WARNING]],
  ])(
    "keeps the verdict and drops the diagnostics for %s",
    async (_name, diagnostics) => {
      for (const success of [true, false]) {
        expect(
          await readBuildServerAnswer(
            json(200, { success, stderr: "log", uuid: null, diagnostics })
          )
        ).toEqual({
          kind: "verdict",
          verdict: { success, stderr: "log", uuid: null, diagnostics: [] },
        });
      }
    }
  );

  it.each([
    ["an empty object", {}],
    ["no success flag", { stderr: "" }],
    ["a non-boolean success", { success: "true", stderr: "" }],
    ["no stderr", { success: true }],
    ["a non-string stderr", { success: false, stderr: 1 }],
    ["a non-string uuid", { success: true, stderr: "", uuid: 7 }],
    ["a non-string binary", { success: true, stderr: "", binary_b64: {} }],
    ["an array", []],
    ["null", null],
  ])("is unavailable for %s", async (_name, body) => {
    expect(await readBuildServerAnswer(json(200, body))).toEqual({
      kind: "unavailable",
      upstreamStatus: 200,
    });
  });

  it("is unavailable when the body is not JSON", async () => {
    expect(await readBuildServerAnswer(text(200))).toEqual({
      kind: "unavailable",
      upstreamStatus: 200,
    });
  });
});

describe("readBuildServerAnswer: an error status", () => {
  it("400 with the JSON error is rejected with that message", async () => {
    expect(
      await readBuildServerAnswer(
        json(400, { error: "  Blocked name 'env' found; rename it " })
      )
    ).toEqual({
      kind: "rejected",
      message: "Blocked name 'env' found; rename it",
    });
  });

  it("caps a rejected message", async () => {
    const answer = await readBuildServerAnswer(
      json(400, { error: "x".repeat(5000) })
    );

    expect(answer.kind).toBe("rejected");
    if (answer.kind === "rejected") {
      expect(answer.message).toHaveLength(MAX_REJECTED_MESSAGE_CHARS);
    }
  });

  it("503 with the JSON error is busy", async () => {
    expect(
      await readBuildServerAnswer(
        json(503, { error: "Build queue is full, try again later" })
      )
    ).toEqual({ kind: "busy" });
  });

  it("429 is busy whatever the body", async () => {
    expect(
      await readBuildServerAnswer(
        new Response("Too Many Requests! Wait for 2s", { status: 429 })
      )
    ).toEqual({ kind: "busy" });
  });

  it.each([400, 503])("%i without the JSON error is unavailable", async (s) => {
    expect(await readBuildServerAnswer(text(s))).toEqual({
      kind: "unavailable",
      upstreamStatus: s,
    });
    expect(await readBuildServerAnswer(json(s, { error: "" }))).toEqual({
      kind: "unavailable",
      upstreamStatus: s,
    });
    expect(await readBuildServerAnswer(json(s, { message: "x" }))).toEqual({
      kind: "unavailable",
      upstreamStatus: s,
    });
  });

  it.each([401, 403, 404, 422, 500, 502, 504])(
    "%i is unavailable, even with a JSON error",
    async (s) => {
      expect(
        await readBuildServerAnswer(json(s, { error: "Internal server error" }))
      ).toEqual({ kind: "unavailable", upstreamStatus: s });
    }
  );
});
