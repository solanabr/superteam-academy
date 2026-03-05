import { defineField, defineType } from "sanity";

export const moduleType = defineType({
  name: "module",
  title: "Module",
  type: "object",
  fields: [
    defineField({
      name: "moduleId",
      type: "string",
      title: "Module ID",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "title",
      type: "localeString",
      title: "Title",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "lessons",
      type: "array",
      title: "Lessons",
      of: [{ type: "lesson" }],
    }),
  ],
  preview: {
    select: { title: "title.pt" },
  },
});
