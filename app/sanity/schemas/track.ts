import { defineField, defineType } from "sanity";

export const track = defineType({
  name: "track",
  title: "Track",
  type: "document",
  fields: [
    defineField({
      name: "trackId",
      title: "Track ID",
      type: "number",
      description: "Maps to on-chain track_id. Must be unique and stable.",
      validation: (rule) =>
        rule
          .required()
          .integer()
          .positive()
          .error("Track ID must be a positive integer"),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) =>
        rule.required().min(1).max(80).error("Name is required"),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      description: "Emoji character or icon identifier (e.g. '🔗' or 'solana')",
    }),
    defineField({
      name: "color",
      title: "Color",
      type: "string",
      description: "Hex color used for UI accents (e.g. '#9945FF')",
      validation: (rule) =>
        rule
          .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
            name: "hex color",
            invert: false,
          })
          .warning("Should be a valid hex color like #9945FF"),
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Sort order for display in the UI (ascending)",
      validation: (rule) => rule.integer().min(0),
    }),
  ],
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
    {
      title: "Track ID",
      name: "trackIdAsc",
      by: [{ field: "trackId", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "description",
      icon: "icon",
      trackId: "trackId",
    },
    prepare({ title, subtitle, icon, trackId }) {
      return {
        title: icon ? `${icon}  ${title}` : title,
        subtitle: `Track #${trackId}${subtitle ? ` — ${subtitle}` : ""}`,
      };
    },
  },
});
