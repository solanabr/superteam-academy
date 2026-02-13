import { defineField, defineType } from 'sanity';

export const courseSchema = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title', maxLength: 96 }, validation: (rule) => rule.required() }),
    defineField({ name: 'description', type: 'text', rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: 'difficulty',
      type: 'string',
      options: { list: ['beginner', 'intermediate', 'advanced'] },
      validation: (rule) => rule.required()
    }),
    defineField({ name: 'durationMinutes', type: 'number', validation: (rule) => rule.required().min(10) }),
    defineField({ name: 'xpTotal', type: 'number', validation: (rule) => rule.required().min(0) }),
    defineField({ name: 'track', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'thumbnail', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'modules', type: 'array', of: [{ type: 'reference', to: [{ type: 'module' }] }] }),
    defineField({
      name: 'status',
      type: 'string',
      options: { list: ['draft', 'published'] },
      initialValue: 'draft',
      validation: (rule) => rule.required()
    })
  ]
});
