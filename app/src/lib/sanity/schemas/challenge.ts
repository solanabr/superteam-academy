import type { Rule } from "sanity";

export const challengeSchema = {
  name: "challenge",
  title: "Code Challenge",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string", validation: (Rule: Rule) => Rule.required() },
    { name: "language", title: "Language", type: "string", options: { list: ["ts", "rust", "json"] } },
    { name: "starterCode", title: "Starter Code", type: "text" },
    { name: "solutionCode", title: "Solution Code", type: "text" },
    { name: "testCode", title: "Test Code", type: "text" },
    { name: "hints", title: "Hints", type: "array", of: [{ type: "string" }] },
    { name: "difficulty", title: "Difficulty", type: "number", options: { list: [1, 2, 3] } },
    { name: "xpReward", title: "XP Reward", type: "number", description: "XP earned for completing this challenge. Defaults to difficulty-based value if not set.", validation: (Rule: Rule) => Rule.min(0).max(500) },
  ],
};
