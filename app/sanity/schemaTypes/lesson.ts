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
    defineField({ name: "xpReward", title: "XP Reward", type: "number" }),
    defineField({ name: "order", title: "Order", type: "number" }),
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
          options: { list: ["typescript", "rust"] },
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
                defineField({ name: "input", title: "Input", type: "string" }),
                defineField({
                  name: "expectedOutput",
                  title: "Expected Output",
                  type: "string",
                }),
                defineField({ name: "label", title: "Label", type: "string" }),
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
