import { describe, it, expect } from "vitest";
import { gradeParsons } from "../graders/parsons";

const block = {
  _type: "parsons" as const,
  key: "arrange",
  prompt: "Arrange the lines.",
  lines: [
    { id: "sig", content: "function add(a, b) {" },
    { id: "ret", content: "  return a + b;" },
    { id: "close", content: "}" },
    { id: "bad", content: "  return a - b;", distractor: true },
  ],
  correctOrder: ["sig", "ret", "close"],
};

describe("gradeParsons", () => {
  it("passes the exact correct order", async () => {
    const r = await gradeParsons(block, { order: ["sig", "ret", "close"] });
    expect(r).toEqual({ ok: true });
  });

  it("403 when the order is wrong (right lines, wrong sequence)", async () => {
    const r = await gradeParsons(block, { order: ["ret", "sig", "close"] });
    expect(r).toEqual({ ok: false, status: 403 });
  });

  it("403 when a distractor is included", async () => {
    const r = await gradeParsons(block, {
      order: ["sig", "ret", "close", "bad"],
    });
    expect(r).toEqual({ ok: false, status: 403 });
  });

  it("403 when a solution line is missing (partial)", async () => {
    const r = await gradeParsons(block, { order: ["sig", "ret"] });
    expect(r).toEqual({ ok: false, status: 403 });
  });

  it("403 on an empty order", async () => {
    const r = await gradeParsons(block, { order: [] });
    expect(r).toEqual({ ok: false, status: 403 });
  });

  it("403 on a malformed proof (order not a string array)", async () => {
    expect(await gradeParsons(block, { order: "nope" })).toEqual({
      ok: false,
      status: 403,
    });
    expect(await gradeParsons(block, { order: [1, 2, 3] })).toEqual({
      ok: false,
      status: 403,
    });
    expect(await gradeParsons(block, {})).toEqual({ ok: false, status: 403 });
  });

  it("503 when the block has no correctOrder array (unjudgeable)", async () => {
    const r = await gradeParsons({ _type: "parsons" }, { order: ["a"] });
    expect(r).toEqual({ ok: false, status: 503 });
  });
});
