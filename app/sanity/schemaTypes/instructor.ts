import { defineField, defineType } from 'sanity'

export const instructor = defineType({
    name: 'instructor',
    title: 'Instructor',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'avatar',
            title: 'Avatar URL',
            type: 'url',
        }),
        defineField({
            name: 'title',
            title: 'Job Title',
            type: 'string',
        }),
        defineField({
            name: 'bio',
            title: 'Biography',
            type: 'text',
        }),
    ],
})
