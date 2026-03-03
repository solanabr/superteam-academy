/**
 * Sanity schema: Course document type.
 *
 * Represents a full course with nested modules and lessons.
 */
import { defineType, defineField } from 'sanity';

export default defineType({
    name: 'course',
    title: 'Course',
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
            name: 'onChainCourseId',
            title: 'On-Chain Course ID',
            type: 'string',
            description: 'Maps to the on-chain Course PDA courseId',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 3,
            validation: (Rule) => Rule.required().max(500),
        }),
        defineField({
            name: 'thumbnail',
            title: 'Thumbnail',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'difficulty',
            title: 'Difficulty',
            type: 'string',
            options: {
                list: [
                    { title: 'Beginner', value: 'easy' },
                    { title: 'Intermediate', value: 'medium' },
                    { title: 'Advanced', value: 'hard' },
                ],
                layout: 'radio',
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'xpPerLesson',
            title: 'XP per Lesson',
            type: 'number',
            validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
            name: 'estimatedDuration',
            title: 'Estimated Duration (minutes)',
            type: 'number',
        }),
        defineField({
            name: 'isPublished',
            title: 'Published',
            type: 'boolean',
            initialValue: false,
        }),
        defineField({
            name: 'publishedAt',
            title: 'Published At',
            type: 'datetime',
        }),
        defineField({
            name: 'tags',
            title: 'Tags',
            type: 'array',
            of: [{ type: 'string' }],
            options: { layout: 'tags' },
        }),
        defineField({
            name: 'instructor',
            title: 'Instructor',
            type: 'reference',
            to: [{ type: 'instructor' }],
        }),
        defineField({
            name: 'track',
            title: 'Track',
            type: 'reference',
            to: [{ type: 'track' }],
        }),
        defineField({
            name: 'modules',
            title: 'Modules',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'module' }] }],
        }),
    ],
    preview: {
        select: { title: 'title', subtitle: 'onChainCourseId' },
    },
});
