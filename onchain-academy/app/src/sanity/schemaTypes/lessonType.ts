import { defineArrayMember, defineField, defineType } from "sanity";

export const lessonType = defineType({
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "lessonId", title: "Lesson ID", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "durationMinutes", title: "Duration (minutes)", type: "number" }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: { list: ["content", "challenge"] },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "videoUrl", title: "Video URL", type: "url" }),
    defineField({
      name: "markdown",
      title: "Markdown Content",
      type: "array",
      of: [defineArrayMember({ type: "block" }), defineArrayMember({ type: "code" })],
    }),
    defineField({ name: "starterCode", title: "Starter Code", type: "text" }),
    defineField({ name: "testCases", title: "Test Cases", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "examQuestion", title: "Exam Question", type: "string" }),
    defineField({ name: "examOptions", title: "Exam Options", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "examCorrectOptionIndex", title: "Exam Correct Option Index", type: "number" }),
    defineField({ name: "order", title: "Order", type: "number", validation: (rule) => rule.required() }),
    defineField({
      name: "courseModule",
      title: "Course Module",
      type: "reference",
      to: [{ type: "courseModule" }],
      validation: (rule) => rule.required(),
    }),
  ],
});

