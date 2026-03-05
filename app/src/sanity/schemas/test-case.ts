import { defineType } from "sanity";

export const testCaseType = defineType({
  name: "testCase",
  title: "Test Case",
  type: "object",
  fields: [
    { name: "input", type: "string", title: "Input" },
    { name: "expected", type: "string", title: "Expected Output" },
  ],
});
