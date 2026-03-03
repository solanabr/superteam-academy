import {defineField, defineType} from 'sanity'

export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
      description: 'Markdown/rich text content for the lesson',
    }),
    defineField({
      name: 'type',
      title: 'Lesson Type',
      type: 'string',
      options: {
        list: [
          {title: 'Content', value: 'content'},
          {title: 'Challenge', value: 'challenge'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'challenge',
      title: 'Challenge Details',
      type: 'challenge',
      hidden: ({parent}) => parent?.type !== 'challenge',
    }),
    defineField({
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      description: 'XP awarded for completing this lesson',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Display order in module',
    }),
    defineField({
      name: 'module',
      title: 'Module',
      type: 'reference',
      to: [{type: 'module'}],
    }),
  ],
})
