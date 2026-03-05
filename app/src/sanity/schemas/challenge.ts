import { defineField, defineType } from "sanity";

export const challengeDocType = defineType({
  name: "challengeDoc",
  title: "Challenge",
  type: "document",
  fields: [
    defineField({
      name: "challengeId",
      type: "string",
      title: "Challenge ID",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: { source: "title.pt" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "title",
      type: "localeString",
      title: "Title",
    }),
    defineField({
      name: "description",
      type: "localeText",
      title: "Description",
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
    }),
    defineField({
      name: "track",
      type: "string",
      title: "Track",
      options: {
        list: ["Rust", "Anchor", "TypeScript", "Assembly", "General"],
      },
    }),
    defineField({
      name: "difficulty",
      type: "string",
      title: "Difficulty",
      options: { list: ["beginner", "intermediate", "advanced"] },
    }),
    defineField({
      name: "tags",
      type: "array",
      title: "Tags",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "reward",
      type: "string",
      title: "Reward",
    }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      options: { list: ["open", "completed", "claimed"] },
      initialValue: "open",
    }),
  ],
  preview: {
    select: { title: "title.pt", subtitle: "track" },
  },
});
