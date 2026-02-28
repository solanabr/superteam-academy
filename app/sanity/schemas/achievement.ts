import { defineField, defineType } from 'sanity';
import { localizedString, localizedText } from './helpers/localized';

export const achievement = defineType({
  name: 'achievement',
  title: 'Achievement',
  type: 'document',
  fields: [
    defineField({
      name: 'achievementId',
      title: 'Achievement ID',
      type: 'string',
      validation: (rule) => rule.required().min(1).max(64),
      description:
        'Unique identifier for the achievement (e.g., "first-lesson", "7-day-streak")',
    }),
    localizedString('name', 'Name'),
    localizedText('description', 'Description'),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Icon name from the icon set.',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Learning', value: 'learning' },
          { title: 'Streak', value: 'streak' },
          { title: 'Challenge', value: 'challenge' },
          { title: 'Social', value: 'social' },
          { title: 'Special', value: 'special' },
        ],
        layout: 'dropdown',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      validation: (rule) => rule.required().min(0).max(100000).integer(),
    }),
    defineField({
      name: 'condition',
      title: 'Condition',
      type: 'object',
      fields: [
        defineField({
          name: 'type',
          title: 'Type',
          type: 'string',
          validation: (rule) => rule.required(),
          description:
            'Condition type (e.g., "lessons_completed", "streak_days", "challenges_won")',
        }),
        defineField({
          name: 'value',
          title: 'Value',
          type: 'number',
          validation: (rule) => rule.required().min(1).integer(),
          description:
            'Threshold value to unlock this achievement (e.g., 10 for 10 lessons completed)',
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name.en', subtitle: 'category' },
  },
});
