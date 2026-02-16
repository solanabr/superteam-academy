import { defineField, defineType } from "sanity";

export const challengeType = defineType({
  name: "challenge",
  title: "Challenge",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "starterCode",
      title: "Starter code",
      type: "text",
      description: "Code pre-filled in the editor",
    }),
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: { list: ["javascript", "rust", "typescript"] },
      initialValue: "javascript",
    }),
    defineField({
      name: "testCases",
      title: "Test cases",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", type: "string", title: "Name" },
            { name: "input", type: "text", title: "Input" },
            { name: "expected", type: "text", title: "Expected output" },
          ],
        },
      ],
    }),
  ],
});
