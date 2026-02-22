import { defineType, defineField } from "sanity";

export const track = defineType({
  name: "track",
  title: "Track",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
    }),
    defineField({ name: "description", title: "Description", type: "text" }),
    defineField({ name: "icon", title: "Icon", type: "string" }),
    defineField({ name: "color", title: "Color", type: "string" }),
    defineField({
      name: "trackId",
      title: "Track ID (On-Chain)",
      type: "number",
      description: "On-chain track identifier matching create_course trackId",
    }),
    defineField({
      name: "collectionAddress",
      title: "Collection Address",
      type: "string",
      description: "Metaplex Core collection address for track credentials",
    }),
  ],
});
