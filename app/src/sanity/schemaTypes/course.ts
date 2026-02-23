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
      validation: (Rule) =>
        Rule.required().custom(async (title, context) => {
          if (!title) return true;

          const client = context.getClient({ apiVersion: "2024-01-01" });
          const id = context.document?._id?.replace(/^drafts\./, "");

          // Check for title collisions across all documents including drafts
          const query = `*[_type == "course" && title == $title && _id != $id && _id != "drafts." + $id][0] { _id }`;
          const params = { title, id };

          const isDuplicate = await client.fetch(query, params);

          if (isDuplicate) {
            return `A course with the title "${title}" already exists. Please choose a unique title to prevent routing issues.`;
          }

          return true;
        }),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) =>
        Rule.required().custom(async (slug, context) => {
          if (!slug?.current) return true;

          const client = context.getClient({ apiVersion: "2024-01-01" });
          const id = context.document?._id?.replace(/^drafts\./, "");

          // Check for slug collisions across all documents including drafts
          const query = `*[_type == "course" && slug.current == $slug && _id != $id && _id != "drafts." + $id][0] { _id }`;
          const params = { slug: slug.current, id };

          const isDuplicate = await client.fetch(query, params);

          if (isDuplicate) {
            return `A course with the slug "${slug.current}" already exists. Slugs must be unique for routing.`;
          }

          return true;
        }),
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
