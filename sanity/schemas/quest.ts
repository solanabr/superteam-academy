import { defineField, defineType } from "sanity";

export const quest = defineType({
  name: "quest",
  title: "Daily Quest",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "type",
      title: "Quest Type",
      type: "string",
      options: {
        list: [
          { title: "Complete a Lesson", value: "lesson" },
          { title: "Complete N Lessons", value: "lesson_batch" },
          { title: "Complete a Challenge", value: "challenge" },
          { title: "Login Streak", value: "login_streak" },
          { title: "Complete a Module", value: "module" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      description:
        "Phosphor icon name (e.g. BookOpen, Code, Lightning, Trophy, Scroll)",
    }),
    defineField({
      name: "xpReward",
      title: "XP Reward",
      type: "number",
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "targetValue",
      title: "Target Value",
      type: "number",
      description:
        "Progress target (e.g. 1 for single completion, 3 for streaks)",
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "resetType",
      title: "Reset Type",
      type: "string",
      options: {
        list: [
          { title: "Daily (resets at midnight UTC)", value: "daily" },
          { title: "Multi-day (persists until completed)", value: "multi_day" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Whether this quest appears in the daily rotation pool",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "type",
    },
  },
});
