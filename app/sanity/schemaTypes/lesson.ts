import { defineType, defineField } from "sanity";

export const lesson = defineType({
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: { list: ["content", "challenge"] },
    }),
    defineField({
      name: "duration",
      title: "Duration (minutes)",
      type: "number",
    }),
    defineField({ name: "order", title: "Order", type: "number" }),
    defineField({
      name: "videoUrl",
      title: "Video URL",
      type: "url",
      description: "YouTube or video embed URL",
    }),
    defineField({
      name: "markdownContent",
      title: "Markdown Content",
      type: "text",
      rows: 20,
      description: "Alternative to rich text — raw markdown content",
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [
        { type: "block" },
        { type: "image", options: { hotspot: true } },
        { type: "code" },
      ],
      hidden: ({ parent }) => parent?.type !== "content",
    }),
    defineField({
      name: "challenge",
      title: "Challenge",
      type: "object",
      hidden: ({ parent }) => parent?.type !== "challenge",
      fields: [
        defineField({ name: "prompt", title: "Prompt", type: "text" }),
        defineField({
          name: "language",
          title: "Language",
          type: "string",
          options: { list: ["typescript", "rust", "json"] },
        }),
        defineField({
          name: "starterCode",
          title: "Starter Code",
          type: "text",
        }),
        defineField({ name: "solution", title: "Solution", type: "text" }),
        defineField({
          name: "testCases",
          title: "Test Cases",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "label", title: "Label", type: "string" }),
                defineField({ name: "input", title: "Input", type: "string" }),
                defineField({
                  name: "expectedOutput",
                  title: "Expected Output (literal)",
                  type: "string",
                  description: "Exact string the function must return. Leave blank when using a Validator.",
                }),
                defineField({
                  name: "validator",
                  title: "Validator (JS expression)",
                  type: "string",
                  description:
                    "JS expression evaluated against `output` (string). Overrides Expected Output. " +
                    "Examples: output.length >= 32 && output.length <= 44 | Number(output) > 0 | output === 'true'",
                }),
              ],
            },
          ],
        }),
        defineField({
          name: "hints",
          title: "Hints",
          type: "array",
          of: [{ type: "string" }],
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "type" },
  },
});
