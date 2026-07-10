import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runLint } from "../lint";
import "../index"; // registers every gate check

const FIXTURE = join(__dirname, "fixtures", "good");

describe("good template fixture", () => {
  it("produces zero error-severity diagnostics", async () => {
    const r = await runLint(FIXTURE);
    const errors = r.diagnostics.filter((d) => d.severity === "error");
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("emits a deferral notice for the rust block (proving the skip is logged, not silent)", async () => {
    const r = await runLint(FIXTURE);
    expect(
      r.diagnostics.some((d) => d.gate === "gate-6" && d.severity === "notice")
    ).toBe(true);
  });
});
