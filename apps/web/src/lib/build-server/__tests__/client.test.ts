import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildProgram } from "../client";

const fetchMock = vi.fn<typeof fetch>();
const request = { files: [{ path: "/src/lib.rs", content: "" }] };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildProgram", () => {
  it("returns the build result on success", async () => {
    fetchMock.mockResolvedValue(
      json(200, { success: true, stderr: "", uuid: "u1", binaryB64: "AAAA" })
    );

    const result = await buildProgram(request);

    expect(result).toMatchObject({ success: true, uuid: "u1" });
    expect(result.kind).toBeUndefined();
  });

  it("carries the route's kind and message on a failure", async () => {
    fetchMock.mockResolvedValue(
      json(502, { success: false, error: "Blocked name", kind: "rejected" })
    );

    expect(await buildProgram(request)).toMatchObject({
      success: false,
      kind: "rejected",
      error: "Blocked name",
    });
  });

  it.each([
    [504, "timeout"],
    [429, "busy"],
    [400, "rejected"],
    [401, "rejected"],
    [500, "unavailable"],
    [502, "unavailable"],
    [503, "unavailable"],
  ])("falls back on the status when a %i has no kind", async (status, kind) => {
    fetchMock.mockResolvedValue(
      new Response("<html></html>", { status, headers: {} })
    );

    expect((await buildProgram(request)).kind).toBe(kind);
  });

  it("ignores a kind it does not know", async () => {
    fetchMock.mockResolvedValue(json(502, { kind: "something-else" }));

    expect((await buildProgram(request)).kind).toBe("unavailable");
  });

  it("reports a request that never reached the app as unavailable", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    expect(await buildProgram(request)).toMatchObject({
      success: false,
      kind: "unavailable",
    });
  });
});
