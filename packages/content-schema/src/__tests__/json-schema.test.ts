import { describe, it, expect } from "vitest";
import { z } from "zod";
import { SCHEMA_TARGETS } from "../../scripts/generate-json-schema";

describe("JSON Schema generation", () => {
  it("covers every authored file type", () => {
    expect(Object.keys(SCHEMA_TARGETS).sort()).toEqual(
      [
        "achievement",
        "course",
        "instructor",
        "lesson",
        "path",
        "quest",
        "quiz",
        "slots",
      ].sort()
    );
  });

  it("emits a valid draft schema for every target", () => {
    for (const [name, schema] of Object.entries(SCHEMA_TARGETS)) {
      const json = z.toJSONSchema(schema, { io: "input" }) as Record<
        string,
        unknown
      >;
      expect(json.$schema, `${name} has no $schema`).toBeTruthy();
    }
  });

  it("expresses the lesson block union so editors can autocomplete `type`", () => {
    const json = JSON.stringify(
      z.toJSONSchema(SCHEMA_TARGETS.lesson!, { io: "input" })
    );
    expect(json).toContain('"prose"');
    expect(json).toContain('"deployed-program-card"');
  });
});
