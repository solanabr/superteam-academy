import { defineType } from "sanity";

export const exerciseType = defineType({
  name: "exercise",
  title: "Exercise",
  type: "object",
  fields: [
    { name: "question", type: "localeString", title: "Question" },
    {
      name: "options",
      type: "array",
      title: "Options",
      of: [{ type: "localeString" }],
    },
    {
      name: "correctIndex",
      type: "number",
      title: "Correct Answer Index (0-based)",
    },
  ],
});
