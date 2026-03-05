import { defineField, defineType } from 'sanity'
import { v4 as uuidv4 } from 'uuid'

export const lesson = defineType({
    name: 'lesson',
    title: 'Lesson',
    type: 'document',
    fields: [
        defineField({
            name: 'id',
            title: 'Lesson ID',
            type: 'slug',
            description: 'Auto-generated unique ID for this lesson',
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
            name: 'type',
            title: 'Lesson Type',
            type: 'string',
            options: {
                list: [
                    { title: 'Reading', value: 'reading' },
                    { title: 'Code Challenge', value: 'code' },
                    { title: 'Quiz', value: 'quiz' },
                    { title: 'Video', value: 'video' },
                    { title: 'Game', value: 'game' },
                ],
            },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'duration',
            title: 'Duration',
            description: 'e.g., 10min',
            type: 'string',
        }),
        defineField({
            name: 'xp',
            title: 'XP Reward',
            type: 'number',
            validation: (rule) => rule.required().min(0),
        }),
        defineField({
            name: 'content',
            title: 'Content (Markdown)',
            type: 'text',
        }),
        // --- Game Reference ---
        defineField({
            name: 'game',
            title: 'Game',
            type: 'reference',
            to: [{ type: 'game' }],
            description: 'Link an externally created game to this lesson.',
            hidden: ({ document }) => document?.type !== 'game',
        }),
        // --- Code Challenge Fields ---
        defineField({
            name: 'language',
            title: 'Programming Language',
            type: 'string',
            hidden: ({ document }) => document?.type !== 'code',
            options: {
                list: [
                    { title: 'TypeScript / JavaScript', value: 'typescript' },
                    { title: 'Rust', value: 'rust' }
                ],
            },
        }),
        defineField({
            name: 'initialCode',
            title: 'Initial Code Template',
            description: 'The starting code provided to the user in the editor',
            type: 'text',
            hidden: ({ document }) => document?.type !== 'code',
        }),
        defineField({
            name: 'solutionCode',
            title: 'Solution Code',
            description: 'The correct solution code for the challenge',
            type: 'text',
            hidden: ({ document }) => document?.type !== 'code',
        }),
        defineField({
            name: 'testCases',
            title: 'Test Cases',
            description: 'Array of assertions or test functions the code must pass. E.g. ["assert(add(1,2)===3)", "assert(add(0,0)===0)"]',
            type: 'array',
            of: [{ type: 'string' }],
            hidden: ({ document }) => document?.type !== 'code',
        }),
        defineField({
            name: 'hints',
            title: 'Hints',
            type: 'array',
            of: [{ type: 'string' }],
            hidden: ({ document }) => document?.type !== 'code',
        }),
        // --- Interactive Quiz Fields ---
        defineField({
            name: 'quiz',
            title: 'Interactive Quiz',
            description: 'Optional. Add a timed, interactive quiz to the end of this lesson.',
            type: 'object',
            fields: [
                defineField({
                    name: 'isRequired',
                    title: 'Required to Pass',
                    description: 'If active, the user cannot complete the lesson until they pass this quiz.',
                    type: 'boolean',
                    initialValue: false,
                }),
                defineField({
                    name: 'timerSeconds',
                    title: 'Timer (Seconds)',
                    description: 'Strict countdown timer in seconds. Leave blank for no time limit.',
                    type: 'number',
                }),
                defineField({
                    name: 'xpReward',
                    title: 'Bonus XP Reward',
                    description: 'Extra XP granted for passing this quiz.',
                    type: 'number',
                    initialValue: 0,
                }),
                defineField({
                    name: 'questions',
                    title: 'Questions',
                    type: 'array',
                    of: [
                        {
                            type: 'object',
                            fields: [
                                defineField({
                                    name: 'question',
                                    title: 'Question',
                                    type: 'string',
                                    validation: (rule) => rule.required(),
                                }),
                                defineField({
                                    name: 'options',
                                    title: 'Options',
                                    type: 'array',
                                    of: [{ type: 'string' }],
                                    validation: (rule) => rule.required().min(2),
                                }),
                                defineField({
                                    name: 'correctOptionIndex',
                                    title: 'Correct Option Index',
                                    description: '0-based index of the correct answer in the Options array.',
                                    type: 'number',
                                    validation: (rule) => rule.required().min(0),
                                }),
                                defineField({
                                    name: 'explanation',
                                    title: 'Explanation (Optional)',
                                    description: 'Shown to the user after they answer.',
                                    type: 'text',
                                }),
                            ],
                            preview: {
                                select: {
                                    title: 'question',
                                }
                            }
                        }
                    ],
                }),
            ],
            options: {
                collapsible: true,
                collapsed: true,
            }
        }),
    ],
})
