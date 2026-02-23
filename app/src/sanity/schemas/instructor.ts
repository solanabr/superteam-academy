import { defineField, defineType } from "sanity";

export default defineType({
  name: "instructor",
  title: "Instructor",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) =>
        Rule.required().error("Instructor name is required."),
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "avatar",
      title: "Avatar",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "twitter",
      title: "Twitter Handle",
      type: "string",
      description: "e.g. @handle (without the @)",
    }),
    defineField({
      name: "github",
      title: "GitHub Username",
      type: "string",
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "avatar",
    },
  },
});
