import { defineField, defineType } from "sanity";
import { capabilityFields } from "./_shared";

/** Mirrors content-schema ProseBlock. `src` is a `.md` path in academy-courses;
 *  the CS-9 sync resolves it to the rendered markdown body written here. */
export const proseBlock = defineType({
  name: "prose",
  title: "Prose",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "src",
      title: "Markdown",
      type: "text",
      rows: 20,
      description:
        "Resolved markdown body (CS-9 resolves ProseBlock.src → content).",
      validation: (r) => r.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Prose" }) },
});
