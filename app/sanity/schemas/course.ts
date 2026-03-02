import { defineField, defineType } from "sanity";

const DIFFICULTY_TITLES: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

export const course = defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({
      name: "courseId",
      title: "Course ID",
      type: "string",
      description:
        "Maps to on-chain course PDA seed. Lowercase, hyphen-separated (e.g. 'intro-solana-v1'). Must be stable after publish.",
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(64)
          .regex(/^[a-z0-9-]+$/, {
            name: "course id format",
            invert: false,
          })
          .error(
            "Course ID is required and must contain only lowercase letters, numbers, and hyphens"
          ),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) =>
        rule.required().min(1).max(120).error("Title is required"),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "URL-safe identifier generated from the title",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required().error("Slug is required"),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "shortDescription",
      title: "Short Description",
      type: "string",
      description: "Used in cards and meta tags. Max 160 characters.",
      validation: (rule) =>
        rule
          .max(160)
          .warning("Short description should be 160 characters or fewer"),
    }),
    defineField({
      name: "image",
      title: "Cover Image",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          description: "Describe the image for screen readers",
        }),
      ],
    }),
    defineField({
      name: "trackId",
      title: "Track ID",
      type: "number",
      description: "Must match a trackId from an existing Track document",
      validation: (rule) =>
        rule
          .required()
          .integer()
          .positive()
          .error("Track ID is required and must be a positive integer"),
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "number",
      description: "1 = Beginner, 2 = Intermediate, 3 = Advanced",
      options: {
        list: [
          { title: "Beginner", value: 1 },
          { title: "Intermediate", value: 2 },
          { title: "Advanced", value: 3 },
        ],
        layout: "radio",
      },
      validation: (rule) =>
        rule.integer().min(1).max(3).error("Difficulty must be 1, 2, or 3"),
    }),
    defineField({
      name: "lessonCount",
      title: "Lesson Count",
      type: "number",
      description:
        "Cached total number of lessons. Should match the length of the lessons array.",
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: "xpPerLesson",
      title: "XP per Lesson",
      type: "number",
      description: "XP awarded on-chain for each completed lesson",
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: {
        list: [
          { title: "English", value: "en" },
          { title: "Portuguese (Brazil)", value: "pt-BR" },
          { title: "Spanish", value: "es" },
        ],
        layout: "radio",
      },
      initialValue: "en",
    }),
    defineField({
      name: "estimatedHours",
      title: "Estimated Hours",
      type: "number",
      description: "Approximate total time to complete the course",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
    }),
    defineField({
      name: "lessons",
      title: "Lessons",
      type: "array",
      description: "Ordered list of lessons in this course",
      of: [
        {
          type: "reference",
          to: [{ type: "lesson" }],
        },
      ],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      description: "Leave blank to keep the course as a draft",
    }),
  ],
  orderings: [
    {
      title: "Published (Newest First)",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "Title A–Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
    {
      title: "Difficulty (Easiest First)",
      name: "difficultyAsc",
      by: [{ field: "difficulty", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      courseId: "courseId",
      difficulty: "difficulty",
      language: "language",
      media: "image",
      publishedAt: "publishedAt",
    },
    prepare({ title, courseId, difficulty, language, media, publishedAt }) {
      const difficultyLabel =
        difficulty !== undefined ? DIFFICULTY_TITLES[difficulty] : undefined;
      const parts = [
        courseId,
        difficultyLabel,
        language ? language.toUpperCase() : undefined,
        !publishedAt ? "DRAFT" : undefined,
      ].filter(Boolean);

      return {
        title,
        subtitle: parts.join(" · "),
        media,
      };
    },
  },
});
