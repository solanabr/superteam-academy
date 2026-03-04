import type { Rule } from "sanity";

export const lessonSchema = {
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string", validation: (Rule: Rule) => Rule.required() },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title" } },
    { name: "lessonIndex", title: "Lesson Index", type: "number", description: "Matches on-chain bitmap index (0-based)" },
    { name: "content", title: "Content", type: "array", of: [
      { type: "block", marks: { decorators: [{ title: "Bold", value: "strong" }, { title: "Italic", value: "em" }, { title: "Code", value: "code" }] } },
      { type: "codeBlock" },
      { type: "callout" },
      { type: "image", options: { hotspot: true } },
    ] },
    { name: "videoUrl", title: "Video URL", type: "url" },
    { name: "estimatedMinutes", title: "Estimated Minutes", type: "number" },
    { name: "challenge", title: "Challenge", type: "reference", to: [{ type: "challenge" }] },
  ],
};
