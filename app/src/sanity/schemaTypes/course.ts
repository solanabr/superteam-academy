import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'track',
      title: 'Learning Track',
      type: 'reference',
      to: [{ type: 'track' }],
    }),
    defineField({
      name: 'instructor',
      title: 'Instructor',
      type: 'reference',
      to: [{ type: 'instructor' }],
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
      },
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'e.g., "4 hours", "2 weeks"',
    }),
    defineField({
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      initialValue: 500,
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'course' }] }],
    }),
    defineField({
      name: 'learningObjectives',
      title: 'Learning Objectives',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Module Title', type: 'string' },
            { name: 'description', title: 'Description', type: 'text' },
            { name: 'order', title: 'Order', type: 'number' },
            {
              name: 'lessons',
              title: 'Lessons',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'lesson' }] }],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      track: 'track.title',
      media: 'thumbnail',
      published: 'published',
    },
    prepare({ title, track, media, published }) {
      return {
        title: `${published ? '' : '[Draft] '}${title}`,
        subtitle: track || 'No track',
        media,
      };
    },
  },
});
