import { defineType, defineField } from "sanity";

export default defineType({
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "type",
      title: "Lesson Type",
      type: "string",
      options: {
        list: [
          { title: "Content (Reading)", value: "content" },
          { title: "Code Challenge", value: "challenge" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "xpReward",
      title: "XP Reward",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "estimatedMinutes",
      title: "Estimated Duration (minutes)",
      type: "number",
    }),
    defineField({
      name: "content",
      title: "Lesson Content",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "code",
          options: {
            language: "rust",
            languageAlternatives: [
              { title: "Rust", value: "rust" },
              { title: "TypeScript", value: "typescript" },
              { title: "JSON", value: "json" },
              { title: "Bash", value: "bash" },
            ],
          },
        },
        { type: "image", options: { hotspot: true } },
      ],
      hidden: ({ document }) => document?.type === "challenge",
    }),
    defineField({
      name: "starterCode",
      title: "Starter Code",
      type: "text",
      description: "Initial code shown in the editor",
      hidden: ({ document }) => document?.type !== "challenge",
    }),
    defineField({
      name: "solutionCode",
      title: "Solution Code",
      type: "text",
      description: "Reference solution (not shown to learners)",
      hidden: ({ document }) => document?.type !== "challenge",
    }),
    defineField({
      name: "testCases",
      title: "Test Cases",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "description", type: "string", title: "Description" }),
            defineField({ name: "input", type: "text", title: "Input" }),
            defineField({ name: "expectedOutput", type: "text", title: "Expected Output" }),
          ],
        },
      ],
      hidden: ({ document }) => document?.type !== "challenge",
    }),
  ],
  preview: {
    select: {
      title: "title",
      type: "type",
      order: "order",
    },
    prepare({ title, type, order }) {
      const icon = type === "challenge" ? "⚡" : "📖";
      return { title: `${icon} ${title}`, subtitle: `Lesson ${order}` };
    },
  },
});
