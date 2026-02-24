import { defineField, defineType } from 'sanity';
import { localizedString, localizedText } from './helpers/localized';

export const dailyChallenge = defineType({
  name: 'dailyChallenge',
  title: 'Daily Challenge',
  type: 'document',
  fields: [
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (rule) => rule.required(),
      description: 'The date this challenge is active (YYYY-MM-DD).',
    }),
    localizedString('title', 'Title'),
    localizedText('description', 'Description'),
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
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      validation: (rule) => rule.required().min(0).max(10000).integer(),
    }),
    defineField({
      name: 'starterCode',
      title: 'Starter Code',
      type: 'text',
      rows: 15,
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
    }),
    defineField({
      name: 'testCases',
      title: 'Test Cases',
      type: 'array',
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
    select: { title: 'title.en', subtitle: 'date' },
  },
  orderings: [
    {
      title: 'Date (Newest First)',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
});
