import { defineArrayMember, defineField, defineType } from 'sanity';

export const lessonSchema = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'order', type: 'number', validation: (rule) => rule.required().min(1) }),
    defineField({
      name: 'type',
      type: 'string',
      options: { list: ['content', 'challenge'] },
      validation: (rule) => rule.required()
    }),
    defineField({ name: 'xpReward', type: 'number', validation: (rule) => rule.required().min(0) }),
    defineField({ name: 'markdown', type: 'text', rows: 12, validation: (rule) => rule.required() }),
    defineField({ name: 'starterCode', type: 'text', rows: 14 }),
    defineField({
      name: 'language',
      type: 'string',
      options: { list: ['rust', 'typescript', 'json'] }
    }),
    defineField({
      name: 'testCases',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'expected', type: 'string', validation: (rule) => rule.required() })
          ]
        })
      ]
    })
  ]
});
