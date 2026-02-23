import { defineField, defineType } from "sanity";

export default defineType({
  name: "module",
  title: "Module",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().error("Module title is required."),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      validation: (Rule) => Rule.required().error("Display order is required."),
    }),
    defineField({
      name: "lessons",
      title: "Lessons",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "lesson" }],
        },
      ],
      description: "Ordered list of lessons within this module.",
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
      order: "order",
      lessons: "lessons",
    },
    prepare({ title, order }) {
      return {
        title: `${order ?? "?"}. ${title}`,
        subtitle: "Module",
      };
    },
  },
});
