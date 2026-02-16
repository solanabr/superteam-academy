import { defineField, defineType } from "sanity";

export const courseType = defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
    }),
    defineField({
      name: "instructor",
      title: "Instructor",
      type: "string",
    }),
    defineField({
      name: "createdBy",
      title: "Created By",
      type: "object",
      fields: [
        { name: "userId", type: "string", title: "User ID" },
        { name: "walletAddress", type: "string", title: "Wallet Address" },
        { name: "role", type: "string", title: "Role" },
      ],
      readOnly: true, // Set by API, not editable in Studio
      hidden: true, // Hide from Studio UI (set programmatically)
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "string",
      description: "e.g. 2 hours, 4 weeks",
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: { list: ["beginner", "intermediate", "advanced"], layout: "dropdown" },
    }),
    defineField({
      name: "track",
      title: "Track",
      type: "string",
      description: "Filter category: Rust, Anchor, Security, etc.",
      options: {
        list: [
          { title: "Rust", value: "rust" },
          { title: "Anchor", value: "anchor" },
          { title: "Security", value: "security" },
          { title: "Solana", value: "solana" },
          { title: "Other", value: "other" },
        ],
      },
    }),
    defineField({
      name: "image",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "modules",
      title: "Modules",
      type: "array",
      of: [{ type: "reference", to: [{ type: "module" }] }],
    }),
  ],
});
