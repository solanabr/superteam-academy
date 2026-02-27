import { defineField, defineType } from "sanity";

export const learningPath = defineType({
  name: "learningPath",
  title: "Learning Path",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "tag",
      title: "Tag",
      type: "string",
      description:
        "Short descriptor shown alongside the title (e.g. 'Foundation', 'Builder')",
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Controls display order on the courses page (lower = first)",
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: {
        list: [
          { title: "Beginner", value: "beginner" },
          { title: "Intermediate", value: "intermediate" },
          { title: "Advanced", value: "advanced" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "courses",
      title: "Courses",
      type: "array",
      of: [{ type: "reference", to: [{ type: "course" }] }],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "difficulty",
    },
  },
});
