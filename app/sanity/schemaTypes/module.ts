import { defineField, defineType } from 'sanity'
import { v4 as uuidv4 } from 'uuid'

export const courseModule = defineType({
    name: 'module',
    title: 'Module',
    type: 'document',
    fields: [
        defineField({
            name: 'id',
            title: 'Module ID',
            type: 'slug',
            description: 'Auto-generated unique ID for this module',
            options: {
                source: () => uuidv4(),
                maxLength: 96,
            },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
        }),
        defineField({
            name: 'lessons',
            title: 'Lessons',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'lesson' }] }],
        }),
    ],
})
