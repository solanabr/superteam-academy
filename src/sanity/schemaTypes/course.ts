type ValidationRule = {
  required: () => unknown;
};

export const courseSchema = {
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    {
      name: "courseId",
      title: "Course ID",
      type: "string",
      validation: (Rule: ValidationRule) => Rule.required(),
    },
    {
      name: "title",
      title: "Title (Translations)",
      type: "object",
      fields: [
        { name: "en", type: "string", title: "English" },
        { name: "pt", type: "string", title: "Portuguese" },
        { name: "es", type: "string", title: "Spanish" },
      ],
    },
    {
      name: "description",
      title: "Description (Translations)",
      type: "object",
      fields: [
        { name: "en", type: "text", title: "English" },
        { name: "pt", type: "text", title: "Portuguese" },
        { name: "es", type: "text", title: "Spanish" },
      ],
    },
    {
      name: "trackCollection",
      title: "Track Collection",
      type: "string",
    },
  ],
};
