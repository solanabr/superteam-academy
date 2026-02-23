import { defineType, defineField } from 'sanity'

export const module = defineType({
  name: 'module',
  title: 'Module',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Module Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [{ type: 'lesson' }],
      validation: Rule => Rule.required().min(1)
    })
  ]
})
