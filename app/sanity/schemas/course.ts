import { defineType, defineField } from "sanity";

export default defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Short Description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: "longDescription",
      title: "Long Description",
      type: "array",
      of: [{ type: "block" }],
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "durationHours",
      title: "Estimated Duration (hours)",
      type: "number",
      validation: (Rule) => Rule.required().min(0.5),
    }),
    defineField({
      name: "xpReward",
      title: "XP Reward (total)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "trackId",
      title: "Track ID",
      type: "number",
      description: "1=Solana Basics, 2=Anchor, 3=DeFi, 4=NFTs, 5=Full-Stack",
      validation: (Rule) => Rule.required().min(1).max(10),
    }),
    defineField({
      name: "thumbnail",
      title: "Thumbnail",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "instructor",
      title: "Instructor",
      type: "reference",
      to: [{ type: "instructor" }],
    }),
    defineField({
      name: "modules",
      title: "Modules",
      type: "array",
      of: [{ type: "reference", to: [{ type: "module" }] }],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "prerequisiteSlug",
      title: "Prerequisite Course Slug",
      type: "string",
      description: "Slug of the course that must be completed first",
    }),
    defineField({
      name: "onChainCourseId",
      title: "On-Chain Course ID",
      type: "string",
      description: "Matches the courseId used in the Anchor program (e.g. anchor-101)",
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
    }),
  ],
  preview: {
    select: {
      title: "title",
      difficulty: "difficulty",
      media: "thumbnail",
    },
    prepare({ title, difficulty, media }) {
      return {
        title,
        subtitle: difficulty,
        media,
      };
    },
  },
});
