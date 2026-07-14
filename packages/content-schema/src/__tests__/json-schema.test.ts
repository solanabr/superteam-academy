import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { SCHEMA_TARGETS } from "../../scripts/generate-json-schema";

/** `schema/` as written by `pnpm schema:generate`. */
const SCHEMA_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../schema"
);

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
        "skills",
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

  // The committed `schema/*.json` are copied verbatim into the content repo,
  // where editors and `validate-content.yml` enforce them. If they drift from
  // the Zod source, a contributor's PR goes green there and then fails the Zod
  // gate at sync time. This caught #386's `produces` amendment, which amended
  // the Zod blocks without regenerating `lesson.schema.json`.
  it.each(Object.keys(SCHEMA_TARGETS))(
    "schema/%s.schema.json is byte-identical to the generated schema",
    (name) => {
      const target = SCHEMA_TARGETS[name as keyof typeof SCHEMA_TARGETS];
      const generated =
        JSON.stringify(z.toJSONSchema(target, { io: "input" }), null, 2) + "\n";
      const committed = readFileSync(
        join(SCHEMA_DIR, `${name}.schema.json`),
        "utf8"
      );
      expect(
        committed,
        `schema/${name}.schema.json is stale — run \`pnpm --filter @superteam-lms/content-schema schema:generate\` and commit the result`
      ).toBe(generated);
    }
  );
});
