import { defineField, defineType } from "sanity";

export const instructor = defineType({
  name: "instructor",
  title: "Instructor",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "avatar",
      title: "Avatar",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "object",
      fields: [
        defineField({
          name: "twitter",
          title: "Twitter",
          type: "string",
        }),
        defineField({
          name: "github",
          title: "GitHub",
          type: "string",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "avatar",
    },
  },
});
