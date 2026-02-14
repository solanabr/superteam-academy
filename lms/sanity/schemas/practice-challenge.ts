import { defineType, defineField, defineArrayMember } from "sanity";

const testCase = defineArrayMember({
  type: "object",
  name: "practiceTestCase",
  title: "Test Case",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "input", title: "Input", type: "text", rows: 2 }),
    defineField({ name: "expectedOutput", title: "Expected Output", type: "text", rows: 2 }),
  ],
});

export const practiceChallenge = defineType({
  name: "practiceChallenge",
  title: "Practice Challenge",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Slug / ID",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
      description: "Used as the challenge ID (e.g., acc-1, txn-2)",
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 2, validation: (r) => r.required() }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: { list: ["easy", "medium", "hard"] },
      initialValue: "easy",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Accounts", value: "accounts" },
          { title: "Transactions", value: "transactions" },
          { title: "PDAs", value: "pdas" },
          { title: "Tokens", value: "tokens" },
          { title: "CPI", value: "cpi" },
          { title: "Serialization", value: "serialization" },
          { title: "Security", value: "security" },
          { title: "Anchor", value: "anchor" },
          { title: "DeFi", value: "defi" },
          { title: "Advanced", value: "advanced" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: { list: ["typescript", "rust"] },
      initialValue: "typescript",
      validation: (r) => r.required(),
    }),
    defineField({ name: "xpReward", title: "XP Reward", type: "number", initialValue: 10, validation: (r) => r.required().min(0) }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({ name: "prompt", title: "Challenge Prompt", type: "text", rows: 3, validation: (r) => r.required() }),
    defineField({ name: "starterCode", title: "Starter Code", type: "text", rows: 10, validation: (r) => r.required() }),
    defineField({ name: "solution", title: "Solution", type: "text", rows: 10, validation: (r) => r.required() }),
    defineField({
      name: "testCases",
      title: "Test Cases",
      type: "array",
      of: [testCase],
    }),
    defineField({
      name: "hints",
      title: "Hints",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({ name: "totalSolves", title: "Total Solves", type: "number", initialValue: 0, readOnly: true }),
    defineField({ name: "isActive", title: "Active", type: "boolean", initialValue: true }),
  ],
  preview: {
    select: { title: "title", difficulty: "difficulty", category: "category" },
    prepare({ title, difficulty, category }) {
      return { title, subtitle: `${difficulty} · ${category}` };
    },
  },
  orderings: [
    {
      title: "Category",
      name: "categoryAsc",
      by: [{ field: "category", direction: "asc" }, { field: "difficulty", direction: "asc" }],
    },
  ],
});
