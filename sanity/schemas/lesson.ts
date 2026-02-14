import { defineField, defineType } from "sanity";

export const lesson = defineType({
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "language",
      title: "Programming Language",
      type: "string",
      description:
        "Language for challenge code. Defaults to TypeScript if unset.",
      options: {
        list: [
          { title: "TypeScript", value: "typescript" },
          { title: "Rust", value: "rust" },
        ],
        layout: "radio",
      },
      initialValue: "typescript",
      hidden: ({ parent }) => parent?.type !== "challenge",
    }),
    defineField({
      name: "buildType",
      title: "Build Type",
      type: "string",
      description:
        "For Rust challenges: 'standard' runs on Rust Playground, 'buildable' compiles via the Build Server (Anchor/Solana programs).",
      options: {
        list: [
          { title: "Standard (Playground)", value: "standard" },
          { title: "Buildable (Build Server)", value: "buildable" },
        ],
        layout: "radio",
      },
      initialValue: "standard",
      hidden: ({ parent }) =>
        parent?.type !== "challenge" || parent?.language !== "rust",
    }),
    defineField({
      name: "deployable",
      title: "Deployable",
      type: "boolean",
      description: "Show 'Deploy to Devnet' button after successful build.",
      initialValue: false,
      hidden: ({ parent }) =>
        parent?.type !== "challenge" || parent?.buildType !== "buildable",
    }),
    defineField({
      name: "widgets",
      title: "Embedded Widgets",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Wallet Funding", value: "wallet-funding" },
          { title: "Program Explorer", value: "program-explorer" },
          { title: "Deployed Program Card", value: "deployed-program-card" },
        ],
      },
      description: "Interactive widgets to embed in content lessons.",
      hidden: ({ parent }) => parent?.type !== "content",
    }),
    defineField({
      name: "programIdl",
      title: "Program IDL (JSON)",
      type: "text",
      description:
        "Paste the Anchor IDL JSON. Required when widgets includes 'program-explorer'. Must contain 'instructions' array and 'metadata.name'.",
      rows: 20,
      hidden: ({ parent }) => !parent?.widgets?.includes("program-explorer"),
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return true;
          try {
            const parsed = JSON.parse(value as string);
            if (
              !Array.isArray(parsed.instructions) ||
              parsed.instructions.length === 0
            ) {
              return "IDL must contain a non-empty 'instructions' array";
            }
            if (!parsed.metadata?.name) {
              return "IDL must contain 'metadata.name' (used for keypair storage)";
            }
            return true;
          } catch {
            return "Invalid JSON";
          }
        }),
    }),
    defineField({
      name: "videoUrl",
      title: "Video URL",
      type: "url",
      description:
        "YouTube or Vimeo URL. Supports youtube.com/watch, youtu.be, and vimeo.com links.",
      validation: (rule) =>
        rule.uri({
          scheme: ["https"],
          allowRelative: false,
        }),
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "text",
      description: "Markdown content for the lesson",
      rows: 20,
    }),
    defineField({
      name: "code",
      title: "Starter Code",
      type: "text",
      description: "Starter code for challenge lessons",
      rows: 15,
      hidden: ({ parent }) => parent?.type !== "challenge",
    }),
    defineField({
      name: "tests",
      title: "Test Cases",
      type: "array",
      hidden: ({ parent }) => parent?.type !== "challenge",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "id",
              title: "Test ID",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "input",
              title: "Input",
              type: "text",
              rows: 3,
            }),
            defineField({
              name: "expectedOutput",
              title: "Expected Output",
              type: "text",
              rows: 3,
            }),
            defineField({
              name: "hidden",
              title: "Hidden Test",
              type: "boolean",
              initialValue: false,
            }),
          ],
          preview: {
            select: {
              title: "description",
              subtitle: "id",
            },
          },
        },
      ],
    }),
    defineField({
      name: "hints",
      title: "Hints",
      type: "array",
      of: [{ type: "text", rows: 3 }],
      hidden: ({ parent }) => parent?.type !== "challenge",
    }),
    defineField({
      name: "solution",
      title: "Solution Code",
      type: "text",
      description: "Complete solution for challenge lessons",
      rows: 15,
      hidden: ({ parent }) => parent?.type !== "challenge",
    }),
    defineField({
      name: "xpReward",
      title: "XP Reward",
      type: "number",
      validation: (rule) => rule.required().min(0),
      initialValue: 10,
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      validation: (rule) => rule.required().min(0),
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
      type: "type",
      order: "order",
    },
    prepare({ title, type, order }) {
      return {
        title: `${order}. ${title}`,
        subtitle: type === "challenge" ? "Challenge" : "Content",
      };
    },
  },
});
