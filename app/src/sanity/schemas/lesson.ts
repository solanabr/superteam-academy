import { defineField, defineType } from "sanity";

export const lessonType = defineType({
  name: "lesson",
  title: "Lesson",
  type: "object",
  fields: [
    defineField({
      name: "lessonId",
      type: "string",
      title: "Lesson ID",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "title",
      type: "localeString",
      title: "Title",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "string",
      title: "Slug",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "lessonType",
      type: "string",
      title: "Type",
      options: { list: ["content", "challenge"] },
      initialValue: "content",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "durationMinutes",
      type: "number",
      title: "Duration (minutes)",
    }),
    defineField({
      name: "xpReward",
      type: "number",
      title: "XP Reward",
    }),
    defineField({
      name: "content",
      type: "localeMarkdown",
      title: "Content (Markdown)",
      hidden: ({ parent }) =>
        (parent as Record<string, unknown>)?.lessonType !== "content",
    }),
    defineField({
      name: "exercise",
      type: "exercise",
      title: "Exercise (Multiple Choice)",
    }),
    defineField({
      name: "challenge",
      type: "challengeBlock",
      title: "Challenge",
      hidden: ({ parent }) =>
        (parent as Record<string, unknown>)?.lessonType !== "challenge",
    }),
  ],
  preview: {
    select: { title: "title.pt", subtitle: "lessonType" },
  },
});
