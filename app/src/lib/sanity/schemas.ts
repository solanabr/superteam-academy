import { defineType, defineField } from "sanity";

export const course = defineType({
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
      name: "courseId",
      title: "On-Chain Course ID",
      type: "string",
      description: "Must match the course_id used in the on-chain program.",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "thumbnail",
      title: "Thumbnail",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "number",
      options: {
        list: [
          { title: "Beginner", value: 1 },
          { title: "Intermediate", value: 2 },
          { title: "Advanced", value: 3 },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "duration",
      title: "Estimated Duration",
      type: "string",
      description: 'e.g. "4 hours", "2 weeks"',
    }),
    defineField({
      name: "trackId",
      title: "Track ID",
      type: "number",
    }),
    defineField({
      name: "trackLevel",
      title: "Track Level",
      type: "number",
    }),
    defineField({
      name: "xpPerLesson",
      title: "XP Per Lesson",
      type: "number",
      validation: (r) => r.min(1),
    }),
    defineField({
      name: "prerequisite",
      title: "Prerequisite Course",
      type: "reference",
      to: [{ type: "course" }],
    }),
    defineField({
      name: "modules",
      title: "Modules",
      type: "array",
      of: [{ type: "module" }],
    }),
    defineField({
      name: "whatYouLearn",
      title: "What You'll Learn",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "isPublished",
      title: "Published",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "creator",
      title: "Creator",
      type: "string",
    }),
    defineField({
      name: "instructor",
      title: "Instructor",
      type: "object",
      fields: [
        defineField({ name: "name", type: "string", title: "Name" }),
        defineField({ name: "avatar", type: "image", title: "Avatar" }),
        defineField({ name: "bio", type: "text", title: "Bio", rows: 2 }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "courseId",
      media: "thumbnail",
    },
  },
});

export const module = defineType({
  name: "module",
  title: "Module",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "lessons",
      title: "Lessons",
      type: "array",
      of: [{ type: "lesson" }],
    }),
  ],
});

export const lesson = defineType({
  name: "lesson",
  title: "Lesson",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Content", value: "content" },
          { title: "Challenge", value: "challenge" },
        ],
      },
      initialValue: "content",
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "code",
          options: {
            language: "rust",
            languageAlternatives: [
              { title: "Rust", value: "rust" },
              { title: "TypeScript", value: "typescript" },
              { title: "JSON", value: "json" },
              { title: "Shell", value: "bash" },
              { title: "TOML", value: "toml" },
            ],
          },
        },
        { type: "image" },
      ],
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "string",
    }),
    defineField({
      name: "challenge",
      title: "Challenge",
      type: "object",
      fields: [
        defineField({ name: "prompt", type: "text", title: "Prompt" }),
        defineField({
          name: "objectives",
          type: "array",
          of: [{ type: "string" }],
          title: "Objectives",
        }),
        defineField({
          name: "starterCode",
          type: "text",
          title: "Starter Code",
        }),
        defineField({
          name: "language",
          type: "string",
          title: "Language",
          options: {
            list: [
              { title: "Rust", value: "rust" },
              { title: "TypeScript", value: "typescript" },
              { title: "JSON", value: "json" },
            ],
          },
        }),
        defineField({
          name: "solution",
          type: "text",
          title: "Solution",
        }),
        defineField({
          name: "hints",
          type: "array",
          of: [{ type: "string" }],
          title: "Hints",
        }),
        defineField({
          name: "testCases",
          type: "array",
          title: "Test Cases",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "name", type: "string", title: "Name" }),
                defineField({
                  name: "expectedOutput",
                  type: "string",
                  title: "Expected Output",
                }),
                defineField({
                  name: "hidden",
                  type: "boolean",
                  title: "Hidden",
                  initialValue: false,
                }),
              ],
            },
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "type",
    },
  },
});
