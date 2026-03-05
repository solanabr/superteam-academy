import { defineType } from "sanity";

export const challengeBlockType = defineType({
  name: "challengeBlock",
  title: "Challenge Block",
  type: "object",
  fields: [
    { name: "prompt", type: "localeText", title: "Prompt" },
    { name: "starterCode", type: "text", title: "Starter Code" },
    {
      name: "language",
      type: "string",
      title: "Language",
      options: { list: ["rust", "typescript", "json"] },
    },
    {
      name: "testCases",
      type: "array",
      title: "Test Cases",
      of: [{ type: "testCase" }],
    },
  ],
});
