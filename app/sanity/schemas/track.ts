import { defineField, defineType } from 'sanity';

export const track = defineType({
  name: 'track',
  title: 'Track',
  type: 'document',
  fields: [
    defineField({
      name: 'trackId',
      title: 'Track ID',
      type: 'string',
      validation: (rule) => rule.required().min(1).max(64),
      description: 'Unique identifier for the track (e.g., "solana-core", "defi")',
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required().min(1).max(128),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Icon name from the icon set (e.g., "rocket", "shield")',
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      description: 'Hex color code for the track (e.g., "#9945FF")',
      validation: (rule) =>
        rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
          name: 'hex color',
          invert: false,
        }),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'trackId' },
  },
});
