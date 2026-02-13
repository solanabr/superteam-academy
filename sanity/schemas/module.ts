import { defineField, defineType } from 'sanity';

export const moduleSchema = defineType({
  name: 'module',
  title: 'Module',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'order', type: 'number', validation: (rule) => rule.required().min(1) }),
    defineField({ name: 'course', type: 'reference', to: [{ type: 'course' }], validation: (rule) => rule.required() }),
    defineField({ name: 'lessons', type: 'array', of: [{ type: 'reference', to: [{ type: 'lesson' }] }] })
  ]
});
