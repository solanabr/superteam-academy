import { defineField, defineType } from "sanity";

export const moduleType = defineType({
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
      description: "Brief overview of what this module covers (optional)",
    }),
    defineField({
      name: "sortOrder",
      title: "Order",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "lessons",
      title: "Lessons",
      type: "array",
      of: [{ type: "reference", to: [{ type: "lesson" }] }],
    }),
    defineField({
      name: "quiz",
      title: "Module Quiz",
      type: "reference",
      to: [{ type: "quiz" }],
      description: "Optional knowledge check at the end of the module",
    }),
  ],
});
