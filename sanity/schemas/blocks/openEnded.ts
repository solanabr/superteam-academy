import { defineField, defineType } from "sanity";
import { capabilityFields } from "./_shared";

/** Mirrors content-schema OpenEndedBlock. One learner message, one AI reply,
 *  feedback only — never graded, never mints XP (spec §8). */
export const openEndedBlock = defineType({
  name: "openEnded",
  title: "Open-Ended Reflection",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "prompt",
      title: "Prompt",
      type: "text",
      rows: 3,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "maxWords",
      title: "Max words",
      type: "number",
      initialValue: 200,
      description: "Bounds one Gemini call.",
      validation: (r) => r.min(20).max(500),
    }),
  ],
  preview: {
    select: { subtitle: "prompt" },
    prepare: ({ subtitle }) => ({ title: "Reflection", subtitle }),
  },
});
