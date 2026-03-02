import { defineType, defineField } from "sanity";

export const challenge = defineType({
  name: "challenge",
  title: "Challenge",
  type: "document",
  fields: [
    defineField({
      name: "prompt",
      title: "Prompt",
      type: "text",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "starterCode",
      title: "Starter Code",
      type: "text",
    }),
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: {
        list: [
          { title: "Rust", value: "rust" },
          { title: "TypeScript", value: "typescript" },
          { title: "JSON", value: "json" },
        ],
      },
    }),
    defineField({
      name: "hints",
      title: "Hints",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "solution",
      title: "Solution",
      type: "text",
    }),
    defineField({
      name: "testCases",
      title: "Test Cases",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "name",
              title: "Name",
              type: "string",
            }),
            defineField({
              name: "input",
              title: "Input",
              type: "string",
            }),
            defineField({
              name: "expectedOutput",
              title: "Expected Output",
              type: "string",
            }),
          ],
        },
      ],
    }),
  ],
});
