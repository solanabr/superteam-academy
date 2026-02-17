import { defineType, defineField } from "sanity";

export const module = defineType({
  name: "module",
  title: "Module",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({ name: "order", title: "Order", type: "number" }),
    defineField({
      name: "lessons",
      title: "Lessons",
      type: "array",
      of: [{ type: "reference", to: [{ type: "lesson" }] }],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "order" },
    prepare({ title, subtitle }) {
      return { title, subtitle: `Module ${subtitle}` };
    },
  },
});
