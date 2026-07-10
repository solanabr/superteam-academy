import { defineField, defineType } from "sanity";
import { capabilityFields } from "./_shared";

/** Mirrors content-schema QuizOption. Correctness keyed on a stable `id`. */
export const quizOption = defineType({
  name: "quizOption",
  title: "Option",
  type: "object",
  fields: [
    defineField({
      name: "id",
      title: "Option ID",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "correct",
      title: "Correct",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "feedback",
      title: "Per-option feedback",
      type: "text",
      rows: 2,
    }),
  ],
  preview: {
    select: { title: "label", correct: "correct" },
    prepare: ({ title, correct }) => ({
      title,
      subtitle: correct ? "correct" : undefined,
    }),
  },
});

/** Mirrors content-schema QuizQuestion. `multiSelect` → correctness is a SET. */
export const quizQuestion = defineType({
  name: "quizQuestion",
  title: "Question",
  type: "object",
  fields: [
    defineField({
      name: "id",
      title: "Question ID",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "prompt",
      title: "Prompt",
      type: "text",
      rows: 2,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "multiSelect",
      title: "Multi-select",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "options",
      title: "Options",
      type: "array",
      of: [{ type: "quizOption" }],
      validation: (r) => r.required().min(2),
    }),
    defineField({
      name: "explanation",
      title: "Explanation",
      type: "text",
      rows: 2,
    }),
  ],
  preview: { select: { title: "prompt" } },
});

/** Mirrors content-schema QuizBlock. Cross-field invariants (exactly-one-correct,
 *  unique ids) are enforced authoritatively by CS-1 Zod at sync time. */
export const quizBlock = defineType({
  name: "quiz",
  title: "Quiz",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "questions",
      title: "Questions",
      type: "array",
      of: [{ type: "quizQuestion" }],
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: { questions: "questions" },
    prepare: ({ questions }) => ({
      title: "Quiz",
      subtitle: `${(questions as unknown[] | undefined)?.length ?? 0} questions`,
    }),
  },
});
