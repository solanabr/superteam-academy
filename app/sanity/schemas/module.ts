import { defineField, defineType } from 'sanity';
import { localizedString, localizedText } from './helpers/localized';

export const module = defineType({
  name: 'module',
  title: 'Module',
  type: 'document',
  fields: [
    localizedString('title', 'Title'),
    localizedText('description', 'Description'),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'lesson' }] }],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      validation: (rule) => rule.required().min(0).integer(),
      description:
        'Display order of this module within its course. Zero-indexed.',
    }),
  ],
  preview: {
    select: { title: 'title.en', subtitle: 'order' },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Untitled Module',
        subtitle: subtitle !== undefined ? `Module ${subtitle}` : '',
      };
    },
  },
});
