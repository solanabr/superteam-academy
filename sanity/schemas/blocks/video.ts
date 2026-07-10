import { defineField, defineType } from "sanity";
import { capabilityFields } from "./_shared";

/** Mirrors content-schema VideoBlock. YouTube/Vimeo, https only;
 *  lesson-client `getEmbedUrl` resolves the embed. */
export const videoBlock = defineType({
  name: "video",
  title: "Video",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "url",
      title: "Video URL",
      type: "url",
      validation: (r) =>
        r.required().uri({ scheme: ["https"], allowRelative: false }),
    }),
  ],
  preview: {
    select: { subtitle: "url" },
    prepare: ({ subtitle }) => ({ title: "Video", subtitle }),
  },
});
