import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'module',
    title: 'Module',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
        }),
        defineField({
            name: 'lessons',
            title: 'Lessons',
            type: 'array',
            of: [{ type: 'reference', to: { type: 'lesson' } }],
        }),
        defineField({
            name: 'order',
            title: 'Sort Order',
            type: 'number',
        }),
    ],
})
