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
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2
    }),
    defineField({
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      options: {
        list: [
          { title: 'Video', value: 'video' },
          { title: 'Article', value: 'article' },
          { title: 'Interactive Code', value: 'interactive' },
          { title: 'Quiz', value: 'quiz' }
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true }
        },
        {
          type: 'code',
          options: {
            language: 'typescript',
            languageAlternatives: [
              { title: 'TypeScript', value: 'typescript' },
              { title: 'JavaScript', value: 'javascript' },
              { title: 'Rust', value: 'rust' },
              { title: 'Python', value: 'python' },
              { title: 'Solidity', value: 'solidity' }
            ]
          }
        }
      ]
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      hidden: ({ document }) => document?.contentType !== 'video'
    }),
    defineField({
      name: 'videoDuration',
      title: 'Video Duration (seconds)',
      type: 'number',
      hidden: ({ document }) => document?.contentType !== 'video'
    }),
    defineField({
      name: 'codeChallenge',
      title: 'Code Challenge',
      type: 'reference',
      to: [{ type: 'codeChallenge' }],
      hidden: ({ document }) => document?.contentType !== 'interactive'
    }),
    defineField({
      name: 'quiz',
      title: 'Quiz',
      type: 'reference',
      to: [{ type: 'quiz' }],
      hidden: ({ document }) => document?.contentType !== 'quiz'
    }),
    defineField({
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      initialValue: 50,
      validation: Rule => Rule.min(0)
    }),
    defineField({
      name: 'estimatedMinutes',
      title: 'Estimated Minutes',
      type: 'number',
      validation: Rule => Rule.min(0)
    }),
    defineField({
      name: 'orderIndex',
      title: 'Order Index',
      type: 'number',
      validation: Rule => Rule.required().min(0)
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: false
    })
  ],
  preview: {
    select: {
      title: 'title',
      contentType: 'contentType',
      orderIndex: 'orderIndex'
    },
    prepare({ title, contentType, orderIndex }) {
      return {
        title: `${orderIndex}. ${title}`,
        subtitle: contentType
      };
    }
  }
});
