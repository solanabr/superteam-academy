type ValidationRule = {
  required: () => unknown;
};

export const lessonSchema = {
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    {
      name: "courseId",
      title: "Course ID",
      type: "string",
      validation: (Rule: ValidationRule) => Rule.required(),
    },
    {
      name: "lessonIndex",
      title: "Lesson Index",
      type: "number",
      validation: (Rule: ValidationRule) => Rule.required(),
    },
    {
      name: "title",
      title: "Title",
      type: "string",
    },
    {
      name: "description",
      title: "Description",
      type: "text",
    },
    {
      name: "xpReward",
      title: "XP Reward",
      type: "number",
    },
    {
      name: "content",
      title: "Content (Markdown)",
      type: "text",
    },
    {
      name: "starterCode",
      title: "Starter Code",
      type: "text",
    },
    {
      name: "videoUrl",
      title: "Video URL",
      type: "url",
      description: "Optional lesson video link (YouTube, Vimeo, Loom, etc.)",
    },
    {
      name: "tests",
      title: "Tests",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", title: "Name", type: "string" },
            { name: "assertion", title: "Assertion", type: "string" },
          ],
        },
      ],
    },
  ],
};
