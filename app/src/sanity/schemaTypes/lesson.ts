import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'lesson',
    title: 'Lesson',
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
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'content',
            title: 'Content',
            type: 'array',
            of: [
                { type: 'block' },
                { type: 'image' },
            ],
        }),
        defineField({
            name: 'videoUrl',
            title: 'Video URL',
            type: 'url',
        }),
        defineField({
            name: 'duration',
            title: 'Duration (minutes)',
            type: 'number',
        }),
        defineField({
            name: 'xp',
            title: 'XP Reward',
            type: 'number',
            initialValue: 10,
        }),
        defineField({
            name: 'order',
            title: 'Sort Order',
            type: 'number',
        }),
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'description',
        },
    },
})
