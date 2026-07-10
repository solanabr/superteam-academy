import { defineField, defineType } from "sanity";
import { capabilityFields } from "./_shared";

/**
 * Mirrors content-schema CodeBlock. `starter`/`solution` are `.ts`/`.rs` paths in
 * academy-courses; CS-9 resolves them to code text here. `tests` is a `.json` path
 * resolved to a `testCase[]` array. `solution` and `tests` are PUBLIC (D4) — the
 * grader reads them from this same projection (spec §10.2).
 */
export const codeBlock = defineType({
  name: "code",
  title: "Code Exercise",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: {
        list: [
          { title: "TypeScript", value: "typescript" },
          { title: "Rust", value: "rust" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "buildType",
      title: "Build Type",
      type: "string",
      description:
        "standard runs in the isolate/Playground; buildable compiles via the Anchor build server (requires language rust).",
      options: {
        list: [
          { title: "Standard (isolate/Playground)", value: "standard" },
          { title: "Buildable (build server)", value: "buildable" },
        ],
        layout: "radio",
      },
      initialValue: "standard",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "deployable",
      title: "Deployable",
      type: "boolean",
      description:
        "Show 'Deploy to Devnet' after a successful build (requires buildType buildable).",
      initialValue: false,
    }),
    defineField({
      name: "starter",
      title: "Starter Code",
      type: "text",
      rows: 15,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "solution",
      title: "Solution Code",
      type: "text",
      rows: 15,
      description:
        "PUBLIC post-D4. The code grader reads this from the same public projection every reader gets.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tests",
      title: "Test Cases",
      type: "array",
      of: [{ type: "testCase" }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "hints",
      title: "Hints",
      type: "array",
      of: [{ type: "text", rows: 3 }],
    }),
  ],
  preview: {
    select: { subtitle: "language" },
    prepare: ({ subtitle }) => ({ title: "Code Exercise", subtitle }),
  },
});
