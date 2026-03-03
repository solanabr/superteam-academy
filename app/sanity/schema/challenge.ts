import { defineField, defineType } from "sanity";

export const challenge = defineType({
  name: "challenge",
  title: "Challenge",
  type: "document",
  fields: [
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Daily", value: "daily" },
          { title: "Seasonal", value: "seasonal" },
          { title: "Sponsored", value: "sponsored" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "xpReward",
      title: "XP Reward",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "config",
      title: "Config",
      type: "object",
      description:
        "Optional config for the challenge (mirrors backend config). Use the fields below for code challenges.",
      fields: [
        defineField({
          name: "codeEnabled",
          title: "Enable code challenge",
          type: "boolean",
          description: "Turn on to make this a code challenge that uses the in-app code editor.",
          initialValue: false,
        }),
        defineField({
          name: "codeLanguage",
          title: "Language",
          type: "string",
          options: {
            list: [
              { title: "TypeScript", value: "typescript" },
              { title: "JavaScript", value: "javascript" },
              { title: "Rust", value: "rust" },
            ],
          },
          hidden: ({ parent }) => !parent?.codeEnabled,
        }),
        defineField({
          name: "starterCode",
          title: "Starter code",
          type: "text",
          rows: 6,
          description: "Initial code shown in the editor. Learners can edit this to solve the challenge.",
          hidden: ({ parent }) => !parent?.codeEnabled,
        }),
        defineField({
          name: "codeTests",
          title: "Test cases",
          type: "array",
          description:
            "Simple input/output tests. Non-technical: describe the input and expected output; the backend will run these.",
          hidden: ({ parent }) => !parent?.codeEnabled,
          of: [
            defineField({
              name: "test",
              title: "Test case",
              type: "object",
              fields: [
                {
                  name: "label",
                  title: "Label",
                  type: "string",
                  description: "Short description shown in the UI, e.g. “small numbers” or “edge case”.",
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: "inputJson",
                  title: "Input (JSON)",
                  type: "text",
                  rows: 3,
                  description: "JSON describing the input to the function, e.g. [1, 2] or {\"a\":1}.",
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: "expectedJson",
                  title: "Expected output (JSON)",
                  type: "text",
                  rows: 3,
                  description: "JSON for the expected result, e.g. 3 or [2, 4].",
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: "hidden",
                  title: "Hidden from learner",
                  type: "boolean",
                  description: "If checked, the test is not shown to the learner (used for anti-cheat).",
                  initialValue: false,
                },
              ],
            }),
          ],
        }),
        defineField({
          name: "requireSubmissionLink",
          title: "Require submission link",
          type: "boolean",
          description:
            "If enabled, learners must also submit a URL (e.g. repo, demo) when completing this code challenge.",
          hidden: ({ parent }) => !parent?.codeEnabled,
          initialValue: false,
        }),
      ],
    }),
    defineField({
      name: "season",
      title: "Season",
      type: "reference",
      to: [{ type: "season" }],
    }),
    defineField({
      name: "startsAt",
      title: "Starts At",
      type: "datetime",
    }),
    defineField({
      name: "endsAt",
      title: "Ends At",
      type: "datetime",
    }),
  ],
  preview: {
    select: {
      title: "title",
      type: "type",
      xpReward: "xpReward",
    },
    prepare({ title, type, xpReward }) {
      const t = type ? String(type) : "—";
      const xp = xpReward != null ? `${xpReward} XP` : "—";
      return {
        title,
        subtitle: `${t} • ${xp}`,
      };
    },
  },
});