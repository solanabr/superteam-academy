export default {
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    },
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Reading', value: 'reading' },
          { title: 'Coding', value: 'coding' },
          { title: 'Quiz', value: 'quiz' },
        ],
      },
    },
    {
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
    },
    // i18n fields - title in multiple languages
    {
      name: 'titleEn',
      title: 'Title (English)',
      type: 'string',
    },
    {
      name: 'titlePtBr',
      title: 'Title (Portuguese BR)',
      type: 'string',
    },
    {
      name: 'titleEs',
      title: 'Title (Spanish)',
      type: 'string',
    },
    // Content for reading lessons
    {
      name: 'contentEn',
      title: 'Content (English)',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'contentPtBr',
      title: 'Content (Portuguese BR)',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'contentEs',
      title: 'Content (Spanish)',
      type: 'array',
      of: [{ type: 'block' }],
    },
    // Coding challenge fields
    {
      name: 'starterCode',
      title: 'Starter Code',
      type: 'text',
    },
    {
      name: 'solution',
      title: 'Solution Code',
      type: 'text',
    },
    {
      name: 'testCases',
      title: 'Test Cases',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'input', title: 'Input', type: 'text' },
            { name: 'expected', title: 'Expected Output', type: 'string' },
            { name: 'description', title: 'Description', type: 'string' },
          ],
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'type',
    },
  },
}
