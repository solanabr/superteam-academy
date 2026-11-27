import { describe, it, expect } from "vitest";
import { MAX_REJECTED_MESSAGE_CHARS, readBuildServerAnswer } from "../failure";

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
      verdict: { success: true, stderr: "", uuid: "u1", binary_b64: "AAAA" },
    });
  });

  it("is a verdict for a compile failure, which has no uuid or binary", async () => {
    expect(
      await readBuildServerAnswer(
        json(200, { success: false, stderr: "error[E0425]", idl: null })
      )
    ).toEqual({
      kind: "verdict",
      verdict: { success: false, stderr: "error[E0425]", uuid: null },
    });
  });

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
