import { defineField, defineType } from "sanity";

export default defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().error("Course title is required."),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 120 },
      validation: (Rule) => Rule.required().error("Slug is required."),
    }),
    defineField({
      name: "description",
      title: "Short Description",
      type: "text",
      rows: 3,
      validation: (Rule) =>
        Rule.required()
          .max(300)
          .error(
            "Short description is required and must be 300 characters or fewer.",
          ),
    }),
    defineField({
      name: "longDescription",
      title: "Long Description",
      type: "blockContent",
      description: "Detailed course description with rich text formatting.",
    }),
    defineField({
      name: "track",
      title: "Track",
      type: "string",
      options: {
        list: [
          { title: "Rust", value: "rust" },
          { title: "Anchor", value: "anchor" },
          { title: "Frontend", value: "frontend" },
          { title: "Security", value: "security" },
          { title: "DeFi", value: "defi" },
          { title: "Mobile", value: "mobile" },
        ],
        layout: "dropdown",
      },
      validation: (Rule) => Rule.required().error("Track is required."),
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
      validation: (Rule) => Rule.required().error("Difficulty is required."),
    }),
    defineField({
      name: "estimatedHours",
      title: "Estimated Hours",
      type: "number",
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .max(100)
          .error("Estimated hours is required and must be between 1 and 100."),
    }),
    defineField({
      name: "xpReward",
      title: "XP Reward",
      type: "number",
      description: "Total XP awarded upon course completion.",
      validation: (Rule) =>
        Rule.required()
          .min(0)
          .error("XP reward is required and must be non-negative."),
    }),
    defineField({
      name: "image",
      title: "Cover Image",
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
      of: [
        {
          type: "reference",
          to: [{ type: "module" }],
        },
      ],
      description: "Ordered list of modules in this course.",
    }),
    defineField({
      name: "prerequisites",
      title: "Prerequisites",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "course" }],
        },
      ],
      description: "Courses that should be completed before starting this one.",
    }),
    defineField({
      name: "learningOutcomes",
      title: "Learning Outcomes",
      type: "array",
      of: [{ type: "string" }],
      description:
        "What learners will be able to do after completing this course.",
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Controls the order in which courses appear in listings.",
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
    {
      title: "Title A-Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
    {
      title: "Difficulty",
      name: "difficultyAsc",
      by: [{ field: "difficulty", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      track: "track",
      difficulty: "difficulty",
      media: "image",
    },
    prepare({ title, track, difficulty, media }) {
      const trackLabel = track
        ? track.charAt(0).toUpperCase() + track.slice(1)
        : "";
      const diffLabel = difficulty
        ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
        : "";
      return {
        title,
        subtitle: [trackLabel, diffLabel].filter(Boolean).join(" / "),
        media,
      };
    },
  },
});
