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
      name: "estimatedTime",
      title: "Estimated Time",
      type: "string",
      description: "e.g. 15 min, 1 hour",
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "text",
      description: "Lesson body in Markdown format",
    }),
    defineField({
      name: "videoUrl",
      title: "Video URL",
      type: "url",
      description: "YouTube or Loom embed URL (optional)",
    }),
    defineField({
      name: "resources",
      title: "Resources",
      type: "array",
      description: "Reference links and additional materials",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", type: "string", title: "Title" },
            { name: "url", type: "url", title: "URL" },
          ],
          preview: {
            select: { title: "title", subtitle: "url" },
          },
        },
      ],
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
