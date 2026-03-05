import { defineField, defineType } from "sanity";

export const courseType = defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({
      name: "courseId",
      type: "string",
      title: "Course ID",
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
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      type: "localeText",
      title: "Description",
    }),
    defineField({
      name: "longDescription",
      type: "localeText",
      title: "Long Description",
    }),
    defineField({
      name: "difficulty",
      type: "string",
      title: "Difficulty",
      options: { list: ["beginner", "intermediate", "advanced"] },
    }),
    defineField({
      name: "duration",
      type: "string",
      title: "Duration",
      options: { list: ["short", "medium", "long"] },
    }),
    defineField({
      name: "totalDurationMinutes",
      type: "number",
      title: "Total Duration (minutes)",
    }),
    defineField({
      name: "xpTotal",
      type: "number",
      title: "Total XP",
    }),
    defineField({
      name: "thumbnail",
      type: "image",
      title: "Thumbnail",
    }),
    defineField({
      name: "instructor",
      type: "reference",
      title: "Instructor",
      to: [{ type: "instructor" }],
    }),
    defineField({
      name: "track",
      type: "string",
      title: "Track",
    }),
    defineField({
      name: "modules",
      type: "array",
      title: "Modules",
      of: [{ type: "module" }],
    }),
    defineField({
      name: "published",
      type: "boolean",
      title: "Published",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title.pt", subtitle: "difficulty", media: "thumbnail" },
  },
});
