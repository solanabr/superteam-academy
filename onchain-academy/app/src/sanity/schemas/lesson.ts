import { defineField, defineType } from "sanity";

export default defineType({
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().error("Lesson title is required."),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 120 },
      validation: (Rule) => Rule.required().error("Slug is required."),
    }),
    defineField({
      name: "type",
      title: "Lesson Type",
      type: "string",
      options: {
        list: [
          { title: "Content", value: "content" },
          { title: "Challenge", value: "challenge" },
        ],
        layout: "radio",
      },
      initialValue: "content",
      validation: (Rule) => Rule.required().error("Lesson type is required."),
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "blockContent",
      description: "Rich text content for the lesson.",
    }),
    defineField({
      name: "markdownContent",
      title: "Markdown Content",
      type: "text",
      rows: 30,
      description:
        "Markdown content for code-heavy lessons. Use this as an alternative to the rich text editor.",
    }),
    defineField({
      name: "challenge",
      title: "Challenge",
      type: "object",
      hidden: ({ parent }) => parent?.type !== "challenge",
      fields: [
        defineField({
          name: "prompt",
          title: "Prompt",
          type: "text",
          rows: 5,
          description: "Describe the challenge the learner must complete.",
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
            layout: "radio",
          },
        }),
        defineField({
          name: "starterCode",
          title: "Starter Code",
          type: "text",
          rows: 15,
          description: "Initial code provided to the learner.",
        }),
        defineField({
          name: "solutionCode",
          title: "Solution Code",
          type: "text",
          rows: 15,
          description: "The expected solution code (hidden from learners).",
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
                  title: "Test Name",
                  type: "string",
                  validation: (Rule) => Rule.required(),
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
                  validation: (Rule) => Rule.required(),
                }),
              ],
              preview: {
                select: { title: "name" },
              },
            },
          ],
        }),
        defineField({
          name: "hints",
          title: "Hints",
          type: "array",
          of: [{ type: "text", rows: 3 }],
          description: "Progressive hints revealed to the learner on request.",
        }),
      ],
    }),
    defineField({
      name: "xpReward",
      title: "XP Reward",
      type: "number",
      validation: (Rule) =>
        Rule.required()
          .min(0)
          .error("XP reward is required and must be non-negative."),
      initialValue: 10,
    }),
    defineField({
      name: "estimatedMinutes",
      title: "Estimated Minutes",
      type: "number",
      description: "Approximate time to complete this lesson in minutes.",
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      validation: (Rule) => Rule.required().error("Display order is required."),
    }),
  ],
  orderings: [
    {
      title: "Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "type",
      order: "order",
    },
    prepare({ title, subtitle, order }) {
      return {
        title: `${order ?? "?"}. ${title}`,
        subtitle: subtitle === "challenge" ? "Challenge" : "Content",
      };
    },
  },
});
