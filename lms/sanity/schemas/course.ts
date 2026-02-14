import { defineType, defineField, defineArrayMember } from "sanity";

const testCase = defineArrayMember({
  type: "object",
  name: "testCase",
  title: "Test Case",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "input", title: "Input", type: "text", rows: 2 }),
    defineField({ name: "expectedOutput", title: "Expected Output", type: "text", rows: 2 }),
  ],
});

const challenge = {
  type: "object" as const,
  name: "challenge",
  title: "Code Challenge",
  fields: [
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: { list: ["typescript", "rust", "json"] },
      initialValue: "typescript",
      validation: (r) => r.required(),
    }),
    defineField({ name: "prompt", title: "Challenge Prompt", type: "text", rows: 3, validation: (r) => r.required() }),
    defineField({ name: "starterCode", title: "Starter Code", type: "text", rows: 10, validation: (r) => r.required() }),
    defineField({ name: "solution", title: "Solution", type: "text", rows: 10, validation: (r) => r.required() }),
    defineField({
      name: "testCases",
      title: "Test Cases",
      type: "array",
      of: [testCase],
    }),
    defineField({
      name: "hints",
      title: "Hints",
      type: "array",
      of: [{ type: "string" }],
    }),
  ],
};

const lesson = defineArrayMember({
  type: "object",
  name: "lesson",
  title: "Lesson",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "description", title: "Description", type: "string" }),
    defineField({ name: "order", title: "Order", type: "number", validation: (r) => r.required().min(0) }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: { list: ["content", "challenge"] },
      initialValue: "content",
      validation: (r) => r.required(),
    }),
    defineField({ name: "xpReward", title: "XP Reward", type: "number", initialValue: 25, validation: (r) => r.required().min(0) }),
    defineField({ name: "duration", title: "Duration", type: "string", initialValue: "15 min" }),
    defineField({ name: "content", title: "Content (Markdown)", type: "text", rows: 20, hidden: ({ parent }) => parent?.type === "challenge" }),
    defineField({ ...challenge, hidden: ({ parent }) => parent?.type !== "challenge" } as never),
  ],
  preview: {
    select: { title: "title", type: "type", order: "order" },
    prepare({ title, type, order }) {
      return { title: `${order}. ${title}`, subtitle: type === "challenge" ? "Challenge" : "Content" };
    },
  },
});

const moduleItem = defineArrayMember({
  type: "object",
  name: "module",
  title: "Module",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "description", title: "Description", type: "string" }),
    defineField({ name: "order", title: "Order", type: "number", validation: (r) => r.required().min(0) }),
    defineField({
      name: "lessons",
      title: "Lessons",
      type: "array",
      of: [lesson],
    }),
  ],
  preview: {
    select: { title: "title", order: "order", lessons: "lessons" },
    prepare({ title, order, lessons }) {
      return { title: `Module ${order + 1}: ${title}`, subtitle: `${lessons?.length ?? 0} lessons` };
    },
  },
});

export const course = defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3, validation: (r) => r.required() }),
    defineField({ name: "thumbnail", title: "Thumbnail", type: "image", options: { hotspot: true } }),
    defineField({
      name: "creator",
      title: "Creator",
      type: "reference",
      to: [{ type: "author" }],
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: { list: ["beginner", "intermediate", "advanced"] },
      initialValue: "beginner",
      validation: (r) => r.required(),
    }),
    defineField({ name: "duration", title: "Duration", type: "string", initialValue: "3 hours" }),
    defineField({ name: "xpTotal", title: "Total XP", type: "number", initialValue: 500, validation: (r) => r.required().min(0) }),
    defineField({
      name: "track",
      title: "Track",
      type: "string",
      options: {
        list: [
          { title: "Standalone", value: "standalone" },
          { title: "Anchor Framework", value: "anchor" },
          { title: "Rust for Solana", value: "rust" },
          { title: "DeFi Development", value: "defi" },
          { title: "Program Security", value: "security" },
        ],
      },
      initialValue: "standalone",
    }),
    defineField({ name: "trackLevel", title: "Track Level", type: "number", initialValue: 1, description: "Position within the track (1 = first course, 2 = second, etc.)" }),
    defineField({
      name: "prerequisite",
      title: "Prerequisite Course",
      type: "reference",
      to: [{ type: "course" }],
      description: "Course that must be completed before enrolling",
    }),
    defineField({ name: "isActive", title: "Active", type: "boolean", initialValue: true }),
    defineField({ name: "totalCompletions", title: "Total Completions", type: "number", initialValue: 0, readOnly: true }),
    defineField({ name: "totalEnrollments", title: "Total Enrollments", type: "number", initialValue: 0, readOnly: true }),
    defineField({
      name: "modules",
      title: "Modules",
      type: "array",
      of: [moduleItem],
    }),
  ],
  preview: {
    select: { title: "title", difficulty: "difficulty", media: "thumbnail" },
    prepare({ title, difficulty, media }) {
      return { title, subtitle: difficulty, media };
    },
  },
});
