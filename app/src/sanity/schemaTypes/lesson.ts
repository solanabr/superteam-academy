import { defineField, defineType } from "sanity";

export const lessonType = defineType({
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
      name: "sortOrder",
      title: "Order",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [{ type: "block" }],
      description: "Lesson body (markdown-like blocks)",
    }),
    defineField({
      name: "lessonType",
      title: "Type",
      type: "string",
      options: { list: ["content", "challenge"], layout: "radio" },
      initialValue: "content",
    }),
    defineField({
      name: "challenge",
      title: "Challenge",
      type: "reference",
      to: [{ type: "challenge" }],
      hidden: ({ parent }) => parent?.lessonType !== "challenge",
    }),
  ],
});
