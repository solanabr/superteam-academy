/**
 * Course schema for Sanity CMS
 *
 * To use with Sanity Studio, import into your sanity.config.ts:
 *   import { defineType, defineField } from 'sanity';
 *   // Then use these field definitions to build your defineType call
 */
export const courseSchema = {
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'description', title: 'Description', type: 'text', rows: 3 },
    { name: 'level', title: 'Level', type: 'string', options: { list: ['Beginner', 'Intermediate', 'Advanced'] } },
    { name: 'track', title: 'Track', type: 'string', options: { list: ['Solana', 'Anchor', 'DeFi', 'NFTs', 'Web3'] } },
    { name: 'xp_reward', title: 'XP Reward', type: 'number' },
    { name: 'lesson_count', title: 'Lesson Count', type: 'number' },
    { name: 'duration', title: 'Duration', type: 'string' },
    { name: 'thumbnail_color', title: 'Thumbnail Color', type: 'string' },
    { name: 'thumbnail_icon', title: 'Thumbnail Icon', type: 'string' },
    { name: 'enrollments', title: 'Enrollments', type: 'number', initialValue: 0 },
    { name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] },
    { name: 'objectives', title: 'Objectives', type: 'array', of: [{ type: 'string' }] },
    { name: 'prerequisites', title: 'Prerequisites', type: 'array', of: [{ type: 'string' }] },
    { name: 'order', title: 'Order', type: 'number', initialValue: 0 },
    {
      name: 'curriculum',
      title: 'Curriculum',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'title', type: 'string', title: 'Lesson Title' },
          { name: 'duration', type: 'string', title: 'Duration' },
          { name: 'xp', type: 'number', title: 'XP' },
          { name: 'free', type: 'boolean', title: 'Free', initialValue: false },
          { name: 'lesson', type: 'reference', title: 'Lesson', to: [{ type: 'lesson' }] },
        ],
      }],
    },
  ],
} as const;
