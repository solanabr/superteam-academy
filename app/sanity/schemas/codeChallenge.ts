import { defineField, defineType } from "sanity";

export const codeChallenge = defineType({
  name: "codeChallenge",
  title: "Code Challenge",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) =>
        rule.required().min(1).max(120).error("Title is required"),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      description:
        "Explains the objective and constraints of this coding challenge",
    }),
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: {
        list: [
          { title: "TypeScript", value: "typescript" },
          { title: "JavaScript", value: "javascript" },
          { title: "Rust", value: "rust" },
        ],
        layout: "radio",
      },
      initialValue: "typescript",
      validation: (rule) => rule.required().error("Language is required"),
    }),
    defineField({
      name: "starterCode",
      title: "Starter Code",
      type: "text",
      description:
        "Initial code provided to the learner in the editor. Include TODO comments to guide implementation.",
      rows: 12,
    }),
    defineField({
      name: "solutionCode",
      title: "Solution Code",
      type: "text",
      description:
        "Reference solution used for grading and shown after the challenge is passed. Keep this private.",
      rows: 12,
    }),
    defineField({
      name: "testCases",
      title: "Test Cases",
      type: "array",
      description:
        "Ordered list of test cases executed against the learner's submission",
      of: [
        {
          name: "testCase",
          title: "Test Case",
          type: "object",
          fields: [
            defineField({
              name: "description",
              title: "Description",
              type: "string",
              description:
                "Human-readable label shown in test output (e.g. 'should return the sum of two positive numbers')",
              validation: (rule) =>
                rule.required().error("Test case description is required"),
            }),
            defineField({
              name: "input",
              title: "Input",
              type: "text",
              description:
                "JSON-serializable input passed to the function under test",
              rows: 3,
            }),
            defineField({
              name: "expectedOutput",
              title: "Expected Output",
              type: "text",
              description: "JSON-serializable expected return value",
              rows: 3,
            }),
          ],
          preview: {
            select: {
              title: "description",
              input: "input",
              expectedOutput: "expectedOutput",
            },
            prepare({ title, input, expectedOutput }) {
              return {
                title: title ?? "Untitled test case",
                subtitle: `in: ${(input ?? "—").slice(0, 40)}  →  out: ${(expectedOutput ?? "—").slice(0, 40)}`,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: "hints",
      title: "Hints",
      type: "array",
      description:
        "Progressive hints revealed one at a time when the learner requests help",
      of: [{ type: "string" }],
      options: {
        layout: "list",
      },
    }),
  ],
  preview: {
    select: {
      title: "title",
      language: "language",
      testCases: "testCases",
    },
    prepare({ title, language, testCases }) {
      const testCount = Array.isArray(testCases) ? testCases.length : 0;
      const parts = [
        language ? language.toUpperCase() : undefined,
        `${testCount} test${testCount !== 1 ? "s" : ""}`,
      ].filter(Boolean);

      return {
        title,
        subtitle: parts.join(" · "),
      };
    },
  },
});
