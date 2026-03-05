import { defineField, defineType } from 'sanity'
import { v4 as uuidv4 } from 'uuid'

export const game = defineType({
    name: 'game',
    title: 'Game',
    type: 'document',
    fields: [
        defineField({
            name: 'gameId',
            title: 'Game ID',
            type: 'slug',
            description: 'Unique identifier used to reference this game externally.',
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
            description: 'Brief summary of what this game teaches.',
        }),
        defineField({
            name: 'engineType',
            title: 'Engine Type',
            type: 'string',
            description: 'The rendering engine or embed method for the game.',
            options: {
                list: [
                    { title: 'ScriblMotion', value: 'scriblmotion' },
                    { title: 'Iframe Embed', value: 'iframe' },
                    { title: 'Custom Component', value: 'custom' },
                ],
            },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'embedUrl',
            title: 'Embed URL',
            type: 'url',
            description: 'URL for iframe-based games (required for "iframe" engine type).',
            hidden: ({ document }) => document?.engineType !== 'iframe',
        }),
        defineField({
            name: 'configJson',
            title: 'Config JSON',
            type: 'text',
            description: 'Engine-specific configuration (e.g. ScriblMotion scene JSON). Paste raw JSON here.',
            hidden: ({ document }) => document?.engineType === 'iframe',
        }),
        defineField({
            name: 'thumbnail',
            title: 'Thumbnail',
            type: 'image',
            description: 'Preview image shown in the course material.',
            options: { hotspot: true },
        }),
        defineField({
            name: 'xpReward',
            title: 'XP Reward',
            type: 'number',
            description: 'XP awarded on game completion.',
            validation: (rule) => rule.min(0),
            initialValue: 25,
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
                ],
            },
        }),
        defineField({
            name: 'requiredScore',
            title: 'Required Score',
            type: 'number',
            description: 'Minimum score (0–100) to count as completion. 0 means any completion counts.',
            validation: (rule) => rule.min(0).max(100),
            initialValue: 0,
        }),
        defineField({
            name: 'tags',
            title: 'Tags',
            type: 'array',
            of: [{ type: 'string' }],
        }),
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'engineType',
            media: 'thumbnail',
        },
    },
})
