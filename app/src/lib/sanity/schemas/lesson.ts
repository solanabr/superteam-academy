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
      validation: (rule) => rule.required(),
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
          { title: "Content", value: "content" },
          { title: "Challenge", value: "challenge" },
        ],
      },
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
    }),
    defineField({
      name: "xpReward",
      title: "XP Reward",
      type: "number",
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "challenge",
      title: "Challenge",
      type: "reference",
      to: [{ type: "challenge" }],
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "string",
    }),
  ],
});
