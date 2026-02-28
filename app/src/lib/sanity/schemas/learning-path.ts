import { defineType, defineField } from "sanity";

export const learningPath = defineType({
  name: "learningPath",
  title: "Learning Path",
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
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
    }),
    defineField({
      name: "courses",
      title: "Courses",
      type: "array",
      of: [{ type: "reference", to: [{ type: "course" }] }],
    }),
    defineField({
      name: "color",
      title: "Color",
      type: "string",
    }),
  ],
});
