import { defineField, defineType } from "sanity";

export const instructorType = defineType({
  name: "instructor",
  title: "Instructor",
  type: "document",
  fields: [
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: { source: "name" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "name",
      type: "string",
      title: "Name",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "role",
      type: "localeString",
      title: "Role",
    }),
    defineField({
      name: "specialties",
      type: "array",
      title: "Specialties",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "avatar",
      type: "image",
      title: "Avatar",
    }),
    defineField({
      name: "bio",
      type: "localeText",
      title: "Bio",
    }),
    defineField({
      name: "profileUrl",
      type: "url",
      title: "Profile URL",
    }),
    defineField({
      name: "links",
      type: "array",
      title: "Links",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", type: "string", title: "Label" },
            { name: "url", type: "url", title: "URL" },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: "name", media: "avatar" },
  },
});
