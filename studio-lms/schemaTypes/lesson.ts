import {defineField, defineType} from 'sanity'

export const contentLessonType = defineType({
  name: 'contentLesson',
  title: 'Content Lesson',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      type: 'string',
      description: 'Unique ID (e.g. af-setup-1)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'duration',
      type: 'number',
      description: 'Duration in minutes',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'xp',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'body',
      type: 'text',
      title: 'Content (Markdown)',
      description:
        'Write in Markdown: # heading, ## subheading, **bold**, *italic*, - list, ``` code blocks ```, [links](url).',
      rows: 16,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'videoUrl',
      type: 'url',
      description: 'Optional video URL',
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare: ({title}) => ({title: title || 'Content Lesson'}),
  },
})

export const challengeLessonType = defineType({
  name: 'challengeLesson',
  title: 'Challenge Lesson',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      type: 'string',
      description: 'Unique ID (e.g. af-setup-3)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'duration',
      type: 'number',
      description: 'Duration in minutes',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'xp',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'prompt',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'starterCode',
      type: 'text',
      rows: 12,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'language',
      type: 'string',
      options: {
        list: [
          {title: 'Rust', value: 'rust'},
          {title: 'TypeScript', value: 'typescript'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'testCases',
      type: 'array',
      of: [{type: 'testCase'}],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare: ({title}) => ({title: title || 'Challenge Lesson'}),
  },
})
