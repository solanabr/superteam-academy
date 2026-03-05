import { defineField, defineType } from 'sanity'
import { v4 as uuidv4 } from 'uuid'

export const course = defineType({
    name: 'course',
    title: 'Course',
    type: 'document',
    fields: [
        defineField({
            name: 'id',
            title: 'Course ID',
            type: 'slug',
            description: 'Auto-generated unique ID for this course',
            options: {
                source: () => uuidv4(),
                maxLength: 96,
            },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
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
            name: 'shortDescription',
            title: 'Short Description',
            type: 'text',
        }),
        defineField({
            name: 'difficulty',
            title: 'Difficulty',
            type: 'string',
            options: {
                list: [
                    { title: 'Beginner', value: 'beginner' },
                    { title: 'Intermediate', value: 'intermediate' },
                    { title: 'Advanced', value: 'advanced' },
                    { title: 'Expert', value: 'expert' },
                ],
            },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'track',
            title: 'Track',
            type: 'string',
        }),
        defineField({
            name: 'duration',
            title: 'Duration',
            type: 'string',
        }),
        defineField({
            name: 'lessonCount',
            title: 'Lesson Count',
            type: 'number',
        }),
        defineField({
            name: 'xpReward',
            title: 'XP Reward',
            type: 'number',
        }),
        defineField({
            name: 'tags',
            title: 'Tags',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'outcomes',
            title: 'Learning Outcomes',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'prerequisites',
            title: 'Prerequisites',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'instructor',
            title: 'Instructor',
            type: 'reference',
            to: [{ type: 'instructor' }],
        }),
        defineField({
            name: 'modules',
            title: 'Modules',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'module' }] }],
        }),
    ],
})
