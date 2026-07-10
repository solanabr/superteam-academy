import { defineField, defineType } from "sanity";

/**
 * A single graded case. Mirrors content-schema `TestCase`. Post-D4 (open book)
 * there is NO `hidden` flag — every test is public, served in the same projection
 * the grader reads. The old `hidden` boolean and the `tests[hidden != true]`
 * stripping it forced are both deleted (spec §10.2).
 */
export const testCase = defineType({
  name: "testCase",
  title: "Test Case",
  type: "object",
  fields: [
    defineField({
      name: "id",
      title: "Test ID",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({ name: "input", title: "Input", type: "text", rows: 3 }),
    defineField({
      name: "expectedOutput",
      title: "Expected Output",
      type: "text",
      rows: 3,
    }),
  ],
  preview: { select: { title: "description", subtitle: "id" } },
});
