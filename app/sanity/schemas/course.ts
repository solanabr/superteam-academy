import { defineField, defineType } from 'sanity';
import { localizedString, localizedText } from './helpers/localized';

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({
      name: 'courseId',
      title: 'Course ID',
      type: 'string',
      validation: (rule) => rule.required().min(1).max(64),
      description:
        'Unique identifier for the course (e.g., "solana-101"). Must be unique across all courses.',
    }),
    localizedString('title', 'Title'),
    localizedText('description', 'Description'),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'track',
      title: 'Track',
      type: 'reference',
      to: [{ type: 'track' }],
      validation: (rule) => rule.required(),
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
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'module' }] }],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'Course IDs of prerequisite courses. Leave empty if none.',
    }),
    defineField({
      name: 'skills',
      title: 'Skills',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Skills gained from completing this course.',
    }),
    defineField({
      name: 'credentialImage',
      title: 'Credential Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Image used for the completion credential NFT.',
    }),
    defineField({
      name: 'xpPerLesson',
      title: 'XP Per Lesson',
      type: 'number',
      initialValue: 25,
      validation: (rule) => rule.min(0).max(1000).integer(),
    }),
    defineField({
      name: 'lessonCount',
      title: 'Lesson Count',
      type: 'number',
      validation: (rule) => rule.min(0).integer(),
      description:
        'Total number of lessons in this course. Used for bitmap progress tracking.',
    }),
  ],
  preview: {
    select: {
      title: 'title.en',
      subtitle: 'courseId',
      media: 'thumbnail',
    },
  },
});
