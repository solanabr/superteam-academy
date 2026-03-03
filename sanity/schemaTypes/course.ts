import {defineField, defineType} from 'sanity'

export const course = defineType({
  name: 'course',
  title: 'Course',
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
      type: 'text',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      options: {
        list: [
          {title: 'Beginner', value: 'beginner'},
          {title: 'Intermediate', value: 'intermediate'},
          {title: 'Advanced', value: 'advanced'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'track',
      title: 'Learning Track',
      type: 'string',
      description: 'e.g., Core, DeFi, Security, NFTs',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'xpReward',
      title: 'XP Reward for Completion',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'instructor',
      title: 'Instructor',
      type: 'object',
      fields: [
        {
          name: 'name',
          type: 'string',
          title: 'Name',
        },
        {
          name: 'avatar',
          type: 'image',
          title: 'Avatar',
        },
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'module'}],
        },
      ],
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'course'}],
        },
      ],
      description: 'Other courses that should be completed first',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'draft',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Published', value: 'published'},
          {title: 'Archived', value: 'archived'},
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      difficulty: 'difficulty',
    },
    prepare(selection) {
      const {title, difficulty} = selection
      return {
        title,
        subtitle: `${difficulty} • Course`,
      }
    },
  },
})
