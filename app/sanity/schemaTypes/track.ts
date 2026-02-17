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
  ],
});
