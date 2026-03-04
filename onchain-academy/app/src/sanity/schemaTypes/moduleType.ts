import { defineField, defineType } from "sanity";

export const moduleType = defineType({
  name: "courseModule",
  title: "Course Module",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "order", title: "Order", type: "number", validation: (rule) => rule.required() }),
    defineField({
      name: "course",
      title: "Course",
      type: "reference",
      to: [{ type: "course" }],
      validation: (rule) => rule.required(),
    }),
  ],
});

