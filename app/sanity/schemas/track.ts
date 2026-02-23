import { defineType, defineField } from "sanity";

export const track = defineType({
  name: "track",
  title: "Track",
  type: "document",
  fields: [
    defineField({
      name: "trackId",
      title: "Track ID",
      type: "number",
      description: "Numeric ID matching on-chain track",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "object",
      fields: [
        { name: "en", title: "English", type: "string" },
        { name: "ptBR", title: "Portuguese (BR)", type: "string" },
        { name: "es", title: "Spanish", type: "string" },
      ],
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "object",
      fields: [
        { name: "en", title: "English", type: "text" },
        { name: "ptBR", title: "Portuguese (BR)", type: "text" },
        { name: "es", title: "Spanish", type: "text" },
      ],
    }),
  ],
  preview: {
    select: { title: "name.en", subtitle: "trackId" },
    prepare({ title, subtitle }) {
      return { title: title || "Untitled", subtitle: `Track ${subtitle}` };
    },
  },
});
