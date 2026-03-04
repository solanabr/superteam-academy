import { defineField, defineType } from "sanity";

export const courseType = defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (rule) => rule.required() }),
    defineField({ name: "description", title: "Description", type: "text" }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: { list: ["Beginner", "Intermediate", "Advanced"] },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "durationHours", title: "Duration (hours)", type: "number" }),
    defineField({ name: "xpReward", title: "XP Reward", type: "number" }),
    defineField({ name: "track", title: "Track", type: "string" }),
    defineField({ name: "thumbnailUrl", title: "Thumbnail URL", type: "url" }),
  ],
});

