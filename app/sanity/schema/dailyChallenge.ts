import { defineField, defineType } from "sanity";

export const dailyChallenge = defineType({
  name: "dailyChallenge",
  title: "Daily Challenge",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().min(5).max(140),
    }),
    defineField({
      name: "challengeDate",
      title: "Challenge Date (UTC)",
      type: "date",
      options: { dateFormat: "YYYY-MM-DD" },
      description: "The UTC date this challenge should appear for.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Prompt",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required().min(20).max(4000),
    }),
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: {
        list: [
          { title: "TypeScript", value: "typescript" },
          { title: "Rust", value: "rust" },
          { title: "JSON", value: "json" },
        ],
      },
      initialValue: "typescript",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "starterCode",
      title: "Starter Code",
      type: "text",
      rows: 18,
      validation: (Rule) => Rule.required().min(10),
    }),
    defineField({
      name: "solutionCode",
      title: "Reference Solution",
      type: "text",
      rows: 18,
      description: "Used by the app test runner for lightweight pattern checks.",
      validation: (Rule) => Rule.required().min(10),
    }),
    defineField({
      name: "testCases",
      title: "Test Cases",
      type: "array",
      of: [
        {
          type: "object",
          name: "dailyTestCase",
          fields: [
            defineField({
              name: "id",
              title: "ID",
              type: "string",
              validation: (Rule) => Rule.required().min(1).max(32),
            }),
            defineField({
              name: "name",
              title: "Name",
              type: "string",
              validation: (Rule) => Rule.required().min(3).max(120),
            }),
            defineField({
              name: "input",
              title: "Input",
              type: "text",
              rows: 2,
            }),
            defineField({
              name: "expected",
              title: "Expected Check",
              type: "text",
              rows: 3,
              description:
                "One rule per line. Prefix with 'regex:' for regex checks; otherwise exact substring check.",
              validation: (Rule) => Rule.required().min(2).max(2000),
            }),
          ],
          preview: {
            select: { title: "name", subtitle: "id" },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "hints",
      title: "Hints",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "xpReward",
      title: "XP Reward (optional)",
      type: "number",
      description:
        "Leave empty to use global fixed XP from NEXT_PUBLIC_DAILY_CHALLENGE_XP.",
      validation: (Rule) => Rule.min(1).max(100000),
    }),
    defineField({
      name: "timeLimitMinutes",
      title: "Time Limit Minutes (optional)",
      type: "number",
      description:
        "Leave empty to use global fixed timer from NEXT_PUBLIC_DAILY_CHALLENGE_TIMER_MINUTES.",
      validation: (Rule) => Rule.min(5).max(240),
    }),
    defineField({
      name: "published",
      title: "Featured (optional)",
      type: "boolean",
      initialValue: false,
      description: "Optional editorial flag for CMS filtering.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      date: "challengeDate",
      language: "language",
      published: "published",
    },
    prepare({ title, date, language, published }) {
      const status = published ? "Featured" : "Standard";
      return {
        title: title,
        subtitle: `${date ?? "No date"} • ${language ?? "unknown"} • ${status}`,
      };
    },
  },
});
