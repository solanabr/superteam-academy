import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'achievement',
  title: 'Achievement',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Lucide icon name',
    }),
    defineField({
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
    }),
    defineField({
      name: 'rarity',
      title: 'Rarity',
      type: 'string',
      options: {
        list: [
          { title: 'Common', value: 'common' },
          { title: 'Rare', value: 'rare' },
          { title: 'Epic', value: 'epic' },
          { title: 'Legendary', value: 'legendary' },
        ],
      },
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Learning', value: 'learning' },
          { title: 'Streak', value: 'streak' },
          { title: 'Social', value: 'social' },
          { title: 'Challenge', value: 'challenge' },
        ],
      },
    }),
    defineField({
      name: 'condition',
      title: 'Unlock Condition',
      type: 'object',
      fields: [
        {
          name: 'type',
          title: 'Condition Type',
          type: 'string',
          options: {
            list: [
              { title: 'Courses Completed', value: 'courses_completed' },
              { title: 'Lessons Completed', value: 'lessons_completed' },
              { title: 'XP Earned', value: 'xp_earned' },
              { title: 'Streak Days', value: 'streak_days' },
              { title: 'Time Spent', value: 'time_spent' },
              { title: 'Custom', value: 'custom' },
            ],
          },
        },
        { name: 'value', title: 'Value', type: 'number' },
      ],
    }),
  ],
});
