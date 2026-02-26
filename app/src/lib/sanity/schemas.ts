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
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "lessonCount",
      title: "Lesson Count",
      description: "Total number of lessons across all modules",
      type: "number",
      validation: (r) => r.min(0),
    }),
    defineField({
      name: "totalCompletions",
      title: "Total Completions",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "creatorRewardXp",
      title: "Creator Reward XP",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "creator",
      title: "Creator",
      type: "string",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Pending Review", value: "pending_review" },
          { title: "Approved", value: "approved" },
          { title: "Rejected", value: "rejected" },
        ],
      },
      initialValue: "draft",
    }),
    defineField({
      name: "submittedBy",
      title: "Submitted By (wallet)",
      type: "string",
    }),
    defineField({
      name: "submittedAt",
      title: "Submitted At",
      type: "datetime",
    }),
    defineField({
      name: "reviewedBy",
      title: "Reviewed By (wallet)",
      type: "string",
    }),
    defineField({
      name: "reviewedAt",
      title: "Reviewed At",
      type: "datetime",
    }),
    defineField({
      name: "rejectionReason",
      title: "Rejection Reason",
      type: "text",
      rows: 3,
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

export const courseModule = defineType({
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
          { title: "Quiz", value: "quiz" },
          { title: "Video", value: "video" },
        ],
      },
      initialValue: "content",
    }),
    defineField({
      name: "videoUrl",
      title: "Video URL",
      description: "YouTube video URL (e.g. https://www.youtube.com/watch?v=...)",
      type: "url",
      hidden: ({ parent }) => parent?.type !== "video",
    }),
    defineField({
      name: "content",
      title: "Rich Content",
      description: "Use this for new content created in Studio",
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
      name: "htmlContent",
      title: "HTML Content",
      description: "Raw HTML content (imported courses). Rich Content takes priority when both exist.",
      type: "text",
      rows: 20,
    }),
    defineField({
      name: "xp",
      title: "XP Reward",
      type: "number",
      validation: (r) => r.min(0),
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
    defineField({
      name: "quiz",
      title: "Quiz",
      type: "object",
      fields: [
        defineField({
          name: "passingScore",
          type: "number",
          title: "Passing Score (%)",
          initialValue: 70,
          validation: (r) => r.min(1).max(100),
        }),
        defineField({
          name: "questions",
          type: "array",
          title: "Questions",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "question", type: "text", title: "Question", rows: 2 }),
                defineField({
                  name: "options",
                  type: "array",
                  of: [{ type: "string" }],
                  title: "Options",
                  validation: (r) => r.min(2).max(6),
                }),
                defineField({
                  name: "correctIndex",
                  type: "number",
                  title: "Correct Option Index (0-based)",
                  validation: (r) => r.min(0),
                }),
                defineField({ name: "explanation", type: "text", title: "Explanation", rows: 2 }),
              ],
              preview: {
                select: { title: "question" },
              },
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
