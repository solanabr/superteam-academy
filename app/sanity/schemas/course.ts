import { defineType, defineField } from "sanity";

export const course = defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({
      name: "courseId",
      title: "Course ID",
      type: "string",
      description: "Must match the on-chain courseId exactly",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "object",
      fields: [
        { name: "en", title: "English", type: "string" },
        { name: "ptBR", title: "Portuguese (BR)", type: "string" },
        { name: "es", title: "Spanish", type: "string" },
      ],
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "object",
      fields: [
        { name: "en", title: "English", type: "text" },
        { name: "ptBR", title: "Portuguese (BR)", type: "text" },
        { name: "es", title: "Spanish", type: "text" },
      ],
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "trackId",
      title: "Track ID",
      type: "number",
      description: "Numeric track ID matching on-chain data",
    }),
  ],
  preview: {
    select: { title: "title.en", subtitle: "courseId" },
  },
});
