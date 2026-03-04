import type { Rule } from "sanity";

export const courseSchema = {
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string", validation: (Rule: Rule) => Rule.required() },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title" } },
    { name: "description", title: "Description", type: "text" },
    { name: "thumbnail", title: "Thumbnail", type: "image", options: { hotspot: true } },
    { name: "difficulty", title: "Difficulty", type: "number", options: { list: [{ title: "Beginner", value: 1 }, { title: "Intermediate", value: 2 }, { title: "Advanced", value: 3 }] } },
    { name: "trackId", title: "Track ID", type: "number" },
    { name: "onChainCourseId", title: "On-Chain Course ID", type: "string" },
    { name: "xpPerLesson", title: "XP Per Lesson", type: "number" },
    { name: "xpPerCourseCompletion", title: "Course Completion XP", type: "number", description: "Bonus XP awarded when learner completes entire course. Default: 500.", initialValue: 500, validation: (Rule: Rule) => Rule.min(0).max(5000) },
    { name: "tags", title: "Tags", type: "array", of: [{ type: "string" }] },
    { name: "prerequisites", title: "Prerequisites", type: "array", of: [{ type: "string" }] },
    { name: "instructor", title: "Instructor", type: "reference", to: [{ type: "instructor" }] },
    { name: "modules", title: "Modules", type: "array", of: [{ type: "reference", to: [{ type: "module" }] }], description: "Organize lessons into modules. If empty, lessons field is used directly." },
    { name: "lessons", title: "Lessons", type: "array", of: [{ type: "reference", to: [{ type: "lesson" }] }] },
    { name: "status", title: "Status", type: "string", options: { list: ["draft", "published"] }, initialValue: "draft" },
    { name: "locale", title: "Locale", type: "string", options: { list: ["pt-BR", "en", "es"] }, initialValue: "pt-BR" },
  ],
};
