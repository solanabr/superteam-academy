import { defineType, defineField } from 'sanity';

export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Content', value: 'content' },
          { title: 'Challenge', value: 'challenge' },
          { title: 'Quiz', value: 'quiz' },
          { title: 'Video', value: 'video' },
        ],
      },
      initialValue: 'content',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true } },
        { type: 'code' },
      ],
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'module',
      title: 'Module',
      type: 'reference',
      to: [{ type: 'module' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      hidden: ({ parent }) => parent?.type !== 'video',
    }),
    defineField({
      name: 'challenge',
      title: 'Challenge',
      type: 'reference',
      to: [{ type: 'challenge' }],
      hidden: ({ parent }) => parent?.type !== 'challenge',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'type' },
  },
});
