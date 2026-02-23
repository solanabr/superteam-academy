import { defineType, defineField } from "sanity";

export const lesson = defineType({
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    defineField({
      name: "course",
      title: "Course",
      type: "reference",
      to: [{ type: "course" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "lessonIndex",
      title: "Lesson Index",
      type: "number",
      description: "0-indexed, must match on-chain lesson order",
      validation: (r) => r.required().min(0).max(255),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "object",
      fields: [
        { name: "en", title: "English", type: "string" },
        { name: "ptBR", title: "Portuguese (BR)", type: "string" },
        { name: "es", title: "Spanish", type: "string" },
      ],
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "code",
          title: "Code Block",
          options: { languageAlternatives: [
            { title: "Rust", value: "rust" },
            { title: "TypeScript", value: "typescript" },
            { title: "JavaScript", value: "javascript" },
            { title: "JSON", value: "json" },
            { title: "Shell", value: "shell" },
          ]},
        },
        { type: "image", options: { hotspot: true } },
      ],
    }),
    defineField({
      name: "codeChallenge",
      title: "Code Challenge",
      type: "object",
      fields: [
        { name: "initialCode", title: "Initial Code", type: "text" },
        { name: "language", title: "Language", type: "string", options: { list: ["rust", "typescript", "javascript"] } },
        { name: "expectedOutput", title: "Expected Output", type: "text" },
        { name: "instructions", title: "Instructions", type: "text" },
      ],
    }),
    defineField({
      name: "quizQuestions",
      title: "Quiz Questions",
      type: "array",
      of: [{
        type: "object",
        fields: [
          { name: "question", title: "Question", type: "string" },
          { name: "options", title: "Options", type: "array", of: [{ type: "string" }] },
          { name: "correctIndex", title: "Correct Answer Index", type: "number" },
        ],
        preview: { select: { title: "question" } },
      }],
    }),
  ],
  orderings: [{ title: "Lesson Order", name: "lessonOrder", by: [{ field: "lessonIndex", direction: "asc" }] }],
  preview: {
    select: { title: "title.en", lessonIndex: "lessonIndex", courseTitle: "course.title.en" },
    prepare({ title, lessonIndex, courseTitle }) {
      return { title: `${lessonIndex}: ${title || "Untitled"}`, subtitle: courseTitle };
    },
  },
});
