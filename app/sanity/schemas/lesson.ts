import { defineField, defineType } from 'sanity';
import { localizedString, localizedBlock } from './helpers/localized';

export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    localizedString('title', 'Title'),
    defineField({
      name: 'lessonIndex',
      title: 'Lesson Index',
      type: 'number',
      validation: (rule) => rule.required().min(0).integer(),
      description:
        'Zero-based index matching the bitmap position for on-chain progress tracking.',
    }),
    localizedBlock('content', 'Content'),
    defineField({
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      validation: (rule) => rule.min(0).max(10000).integer(),
      description: 'XP awarded on lesson completion. Overrides course default if set.',
    }),
    defineField({
      name: 'hasCodeEditor',
      title: 'Has Code Editor',
      type: 'boolean',
      initialValue: false,
      description: 'Whether this lesson includes an interactive code editor.',
    }),
    defineField({
      name: 'starterCode',
      title: 'Starter Code',
      type: 'text',
      rows: 15,
      hidden: ({ document }) => !document?.hasCodeEditor,
      description: 'Pre-filled code in the editor when the lesson loads.',
    }),
    defineField({
      name: 'solution',
      title: 'Solution',
      type: 'text',
      rows: 15,
      hidden: ({ document }) => !document?.hasCodeEditor,
      description:
        'Reference solution. Hidden from the API by default — only used for validation.',
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          { title: 'Rust', value: 'rust' },
          { title: 'TypeScript', value: 'typescript' },
          { title: 'JSON', value: 'json' },
        ],
      },
      hidden: ({ document }) => !document?.hasCodeEditor,
    }),
    defineField({
      name: 'isChallenge',
      title: 'Is Challenge',
      type: 'boolean',
      initialValue: false,
      description:
        'Challenge lessons require passing test cases to complete.',
    }),
    defineField({
      name: 'testCases',
      title: 'Test Cases',
      type: 'array',
      hidden: ({ document }) => !document?.isChallenge,
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'description',
              title: 'Description',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'input',
              title: 'Input',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'expectedOutput',
              title: 'Expected Output',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'points',
              title: 'Points',
              type: 'number',
              validation: (rule) => rule.required().min(1).integer(),
            }),
            defineField({
              name: 'hidden',
              title: 'Hidden',
              type: 'boolean',
              initialValue: false,
              description:
                'Hidden test cases are not shown to the learner before submission.',
            }),
          ],
          preview: {
            select: { title: 'description', subtitle: 'points' },
            prepare({ title, subtitle }) {
              return {
                title: title || 'Untitled Test',
                subtitle: subtitle ? `${subtitle} pts` : '',
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title.en', subtitle: 'lessonIndex' },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Untitled Lesson',
        subtitle: subtitle !== undefined ? `Index: ${subtitle}` : '',
      };
    },
  },
});
