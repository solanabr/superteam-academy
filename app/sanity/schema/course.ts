import { defineType, defineField } from 'sanity'

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'Course ID',
      type: 'string',
      description: 'Unique identifier (e.g., "solana-fundamentals")',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'lessonCount',
      title: 'Lesson Count',
      type: 'number',
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'xpPerLesson',
      title: 'XP Per Lesson',
      type: 'number',
      validation: Rule => Rule.required().min(0)
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'e.g., "3 hours"',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }]
    }),
    defineField({
      name: 'image',
      title: 'Course Image',
      type: 'image',
      options: { hotspot: true }
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [{ type: 'module' }],
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
      description: 'Only published courses will appear on the site'
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'difficulty',
      media: 'image',
      published: 'published'
    },
    prepare({ title, subtitle, media, published }) {
      return {
        title: `${title}${published ? '' : ' (Draft)'}`,
        subtitle: `${subtitle || 'No difficulty'} • ${published ? 'Published' : 'Draft'}`,
        media
      }
    }
  }
})
