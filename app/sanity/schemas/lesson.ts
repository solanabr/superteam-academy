/**
 * Sanity schema: Lesson document type.
 *
 * Supports three lesson types: content, challenge, video.
 * Any lesson type may have an optional quiz.
 */
import { defineType, defineField } from 'sanity';

export default defineType({
    name: 'lesson',
    title: 'Lesson',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule) => Rule.required().max(120),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'title', maxLength: 96 },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'type',
            title: 'Lesson Type',
            type: 'string',
            options: {
                list: [
                    { title: 'Content', value: 'content' },
                    { title: 'Challenge', value: 'challenge' },
                    { title: 'Video', value: 'video' },
                ],
                layout: 'radio',
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'order',
            title: 'Order',
            type: 'number',
            validation: (Rule) => Rule.required().min(0),
        }),
        defineField({
            name: 'duration',
            title: 'Duration (minutes)',
            type: 'number',
            validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
            name: 'xpReward',
            title: 'XP Reward',
            type: 'number',
            validation: (Rule) => Rule.required().min(0),
        }),
        // --- Content lesson fields ---
        defineField({
            name: 'content',
            title: 'Content (Markdown)',
            type: 'text',
            rows: 20,
            hidden: ({ document }) => document?.type !== 'content',
        }),
        // --- Video lesson fields ---
        defineField({
            name: 'videoUrl',
            title: 'Video URL (YouTube / Vimeo / External)',
            type: 'url',
            description: 'Paste an external video URL (YouTube, Vimeo, etc.)',
            hidden: ({ document }) => document?.type !== 'video',
        }),
        defineField({
            name: 'videoFile',
            title: 'Video File (Direct Upload)',
            type: 'file',
            description: 'Or upload a video file directly (mp4, webm, mov)',
            options: { accept: 'video/mp4,video/webm,video/quicktime' },
            hidden: ({ document }) => document?.type !== 'video',
        }),
        // --- Challenge lesson fields ---
        defineField({
            name: 'challenge',
            title: 'Challenge',
            type: 'object',
            hidden: ({ document }) => document?.type !== 'challenge',
            fields: [
                defineField({
                    name: 'language',
                    title: 'Language',
                    type: 'string',
                    options: {
                        list: ['rust', 'typescript', 'json'],
                    },
                }),
                defineField({
                    name: 'instructions',
                    title: 'Instructions (Markdown)',
                    type: 'markdown',
                }),
                defineField({
                    name: 'starterCode',
                    title: 'Starter Code',
                    type: 'code',
                }),
                defineField({
                    name: 'solutionCode',
                    title: 'Solution Code',
                    type: 'code',
                }),
                defineField({
                    name: 'testCases',
                    title: 'Test Cases',
                    type: 'array',
                    of: [
                        {
                            type: 'object',
                            fields: [
                                { name: 'name', title: 'Name', type: 'string' },
                                { name: 'input', title: 'Input', type: 'text' },
                                { name: 'expectedOutput', title: 'Expected Output', type: 'text' },
                                { name: 'isHidden', title: 'Hidden', type: 'boolean', initialValue: false },
                            ],
                        },
                    ],
                }),
            ],
        }),
        // --- Quiz (available for any lesson type) ---
        defineField({
            name: 'quiz',
            title: 'Quiz',
            type: 'object',
            fields: [
                defineField({
                    name: 'passThreshold',
                    title: 'Pass Threshold (%)',
                    type: 'number',
                    validation: (Rule) => Rule.min(0).max(100),
                    initialValue: 70,
                }),
                defineField({
                    name: 'questions',
                    title: 'Questions',
                    type: 'array',
                    of: [
                        {
                            type: 'object',
                            fields: [
                                { name: 'question', title: 'Question', type: 'string' },
                                {
                                    name: 'options',
                                    title: 'Options',
                                    type: 'array',
                                    of: [{ type: 'string' }],
                                },
                                {
                                    name: 'correctIndex',
                                    title: 'Correct Option Index (0-based)',
                                    type: 'number',
                                },
                            ],
                        },
                    ],
                }),
            ],
        }),
        // --- Hints ---
        defineField({
            name: 'hints',
            title: 'Hints',
            type: 'array',
            of: [{ type: 'string' }],
        }),
    ],
    orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
    preview: {
        select: { title: 'title', type: 'type', order: 'order' },
        prepare({ title, type, order }) {
            const emoji = type === 'challenge' ? '🧩' : type === 'video' ? '🎥' : '📖';
            return { title: `${order ?? '?'}. ${emoji} ${title}` };
        },
    },
});
