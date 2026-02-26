/**
 * Sanity CMS Schema for Superteam Academy
 * 
 * Document types:
 * - track: Learning track (e.g. "Solana Fundamentals")
 * - instructor: Course instructor profile
 * - course: Main course document
 * - module: Course module (group of lessons)
 * - lesson: Individual lesson (content or challenge)
 */

export const trackSchema = {
  name: "track",
  title: "Learning Track",
  type: "document",
  fields: [
    { name: "name", title: "Name", type: "string" },
    { name: "slug", title: "Slug", type: "slug", options: { source: "name" } },
    { name: "description", title: "Description", type: "text" },
    { name: "color", title: "Color (hex)", type: "string" },
    { name: "icon", title: "Icon (emoji)", type: "string" },
    { name: "order", title: "Order", type: "number" },
  ],
};

export const instructorSchema = {
  name: "instructor",
  title: "Instructor",
  type: "document",
  fields: [
    { name: "name", title: "Full Name", type: "string" },
    { name: "bio", title: "Bio", type: "text" },
    { name: "avatar", title: "Avatar", type: "image" },
    { name: "twitter", title: "Twitter Handle", type: "string" },
    { name: "github", title: "GitHub Username", type: "string" },
    { name: "website", title: "Website", type: "url" },
  ],
};

export const challengeSchema = {
  name: "challenge",
  title: "Code Challenge",
  type: "document",
  fields: [
    { name: "prompt", title: "Challenge Prompt", type: "text" },
    {
      name: "language",
      title: "Language",
      type: "string",
      options: { list: ["typescript", "rust", "json", "bash"] },
    },
    { name: "starterCode", title: "Starter Code", type: "text" },
    { name: "solution", title: "Solution", type: "text" },
    {
      name: "testCases",
      title: "Test Cases",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "description", type: "string" },
            { name: "input", type: "string" },
            { name: "expectedOutput", type: "string" },
            { name: "isHidden", type: "boolean" },
          ],
        },
      ],
    },
    { name: "hints", title: "Hints", type: "array", of: [{ type: "string" }] },
  ],
};

export const lessonSchema = {
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string" },
    {
      name: "type",
      title: "Type",
      type: "string",
      options: { list: ["content", "challenge", "video", "quiz"] },
    },
    { name: "duration", title: "Duration (minutes)", type: "number" },
    { name: "lessonIndex", title: "Lesson Index (0-255)", type: "number" },
    { name: "xpReward", title: "XP Reward", type: "number" },
    {
      name: "content",
      title: "Content",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "alt", type: "string", title: "Alt text" }],
        },
        {
          type: "object",
          name: "codeBlock",
          title: "Code Block",
          fields: [
            { name: "language", type: "string", title: "Language" },
            { name: "code", type: "text", title: "Code" },
          ],
        },
      ],
    },
    {
      name: "challenge",
      title: "Code Challenge",
      type: "reference",
      to: [{ type: "challenge" }],
    },
    {
      name: "videoUrl",
      title: "Video URL",
      type: "url",
    },
  ],
};

export const moduleSchema = {
  name: "module",
  title: "Module",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string" },
    { name: "description", title: "Description", type: "text" },
    { name: "order", title: "Order", type: "number" },
    {
      name: "lessons",
      title: "Lessons",
      type: "array",
      of: [{ type: "reference", to: [{ type: "lesson" }] }],
    },
  ],
};

export const courseSchema = {
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string" },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
    },
    { name: "shortDescription", title: "Short Description", type: "string" },
    { name: "description", title: "Full Description", type: "text" },
    {
      name: "thumbnail",
      title: "Thumbnail",
      type: "image",
      options: { hotspot: true },
    },
    {
      name: "instructor",
      title: "Instructor",
      type: "reference",
      to: [{ type: "instructor" }],
    },
    {
      name: "track",
      title: "Learning Track",
      type: "reference",
      to: [{ type: "track" }],
    },
    {
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: {
        list: ["beginner", "intermediate", "advanced", "expert"],
      },
    },
    { name: "duration", title: "Duration (minutes)", type: "number" },
    { name: "lessonCount", title: "Total Lessons", type: "number" },
    { name: "xpReward", title: "XP Reward (completion)", type: "number" },
    { name: "xpPerLesson", title: "XP per Lesson", type: "number" },
    { name: "tags", title: "Tags", type: "array", of: [{ type: "string" }] },
    { name: "language", title: "Language Code", type: "string" },
    { name: "isActive", title: "Active", type: "boolean" },
    { name: "enrolledCount", title: "Enrolled Count", type: "number" },
    { name: "rating", title: "Rating (0-5)", type: "number" },
    { name: "reviewCount", title: "Review Count", type: "number" },
    { name: "trackId", title: "On-Chain Track ID", type: "number" },
    { name: "trackLevel", title: "Track Level", type: "number" },
    { name: "courseId", title: "On-Chain Course ID", type: "string" },
    {
      name: "prerequisite",
      title: "Prerequisite Course",
      type: "reference",
      to: [{ type: "course" }],
    },
    {
      name: "modules",
      title: "Modules",
      type: "array",
      of: [{ type: "reference", to: [{ type: "module" }] }],
    },
  ],
  preview: {
    select: {
      title: "title",
      difficulty: "difficulty",
      media: "thumbnail",
    },
    prepare({ title, difficulty, media }: { title: string; difficulty: string; media: unknown }) {
      return {
        title,
        subtitle: difficulty,
        media,
      };
    },
  },
};

export const schema = {
  types: [
    trackSchema,
    instructorSchema,
    challengeSchema,
    lessonSchema,
    moduleSchema,
    courseSchema,
  ],
};
