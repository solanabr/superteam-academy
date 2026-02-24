import { defineType, defineField } from 'sanity'

export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      title: 'Lesson ID',
      type: 'string',
      description: 'Unique identifier (e.g., "sol-fund-1")',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Content', value: 'content' },
          { title: 'Challenge', value: 'challenge' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'e.g., "15 min"',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'text',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'challengeCode',
      title: 'Challenge Starter Code',
      type: 'text',
      description: 'Starter code for challenge lessons',
      hidden: ({ parent }) => parent?.type !== 'challenge'
    }),
    defineField({
      name: 'challengeTests',
      title: 'Challenge Tests/Objective',
      type: 'text',
      description: 'Test requirements or objective for challenge lessons',
      hidden: ({ parent }) => parent?.type !== 'challenge'
    })
  ]
})
