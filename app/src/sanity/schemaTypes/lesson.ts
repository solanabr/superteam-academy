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
      name: 'course',
      title: 'Course',
      type: 'reference',
      to: [{ type: 'course' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'module',
      title: 'Module Key',
      type: 'string',
      description: 'Key of the module this lesson belongs to',
    }),
    defineField({
      name: 'type',
      title: 'Lesson Type',
      type: 'string',
      options: {
        list: [
          { title: 'Video', value: 'video' },
          { title: 'Reading', value: 'reading' },
          { title: 'Challenge', value: 'challenge' },
          { title: 'Quiz', value: 'quiz' },
          { title: 'Interactive', value: 'interactive' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'URL for video content (YouTube, Vimeo, Facebook, or direct video URL)',
      hidden: ({ parent }) => parent?.type !== 'video',
    }),
    defineField({
      name: 'videoProvider',
      title: 'Video Provider',
      type: 'string',
      options: {
        list: [
          { title: 'YouTube', value: 'youtube' },
          { title: 'Vimeo', value: 'vimeo' },
          { title: 'Facebook', value: 'facebook' },
          { title: 'Direct URL', value: 'direct' },
        ],
      },
      hidden: ({ parent }) => parent?.type !== 'video',
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number',
    }),
    defineField({
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      initialValue: 50,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'code',
          options: {
            language: 'typescript',
            languageAlternatives: [
              { title: 'TypeScript', value: 'typescript' },
              { title: 'JavaScript', value: 'javascript' },
              { title: 'Rust', value: 'rust' },
              { title: 'JSON', value: 'json' },
              { title: 'Shell', value: 'shell' },
            ],
          },
        },
        { type: 'image' },
      ],
    }),
    defineField({
      name: 'hints',
      title: 'Hints',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'challenge',
      title: 'Code Challenge',
      type: 'object',
      fields: [
        { name: 'instructions', title: 'Instructions', type: 'text' },
        { name: 'starterCode', title: 'Starter Code', type: 'code' },
        { name: 'solutionCode', title: 'Solution Code', type: 'code' },
        { name: 'language', title: 'Language', type: 'string' },
        {
          name: 'testCases',
          title: 'Test Cases',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'input', title: 'Input', type: 'string' },
                { name: 'expectedOutput', title: 'Expected Output', type: 'string' },
                { name: 'description', title: 'Description', type: 'string' },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'quiz',
      title: 'Quiz',
      type: 'object',
      fields: [
        { name: 'question', title: 'Question', type: 'text' },
        {
          name: 'options',
          title: 'Options',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'text', title: 'Option Text', type: 'string' },
                { name: 'isCorrect', title: 'Is Correct', type: 'boolean' },
                { name: 'explanation', title: 'Explanation', type: 'string' },
              ],
            },
          ],
        },
        { name: 'xpReward', title: 'XP Reward', type: 'number' },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      type: 'type',
      course: 'course.title',
    },
    prepare({ title, type, course }) {
      const typeLabel = {
        video: '[Video]',
        reading: '[Reading]',
        challenge: '[Challenge]',
        quiz: '[Quiz]',
        interactive: '[Interactive]',
      } as Record<string, string>;
      return {
        title,
        subtitle: `${typeLabel[type] || '[Lesson]'} ${course || 'No course'}`,
      };
    },
  },
});
