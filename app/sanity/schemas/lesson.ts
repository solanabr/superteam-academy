// Sanity schema for Lesson documents
// Deploy this to your Sanity studio

export default {
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    },
    {
      name: 'content',
      title: 'Lesson Content',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'code',
          options: {
            language: 'rust',
            languageAlternatives: [
              { title: 'Rust', value: 'rust' },
              { title: 'TypeScript', value: 'typescript' },
              { title: 'JavaScript', value: 'javascript' },
              { title: 'JSON', value: 'json' },
              { title: 'Bash', value: 'bash' },
            ],
            withFilename: true,
          },
        },
        {
          type: 'image',
          options: {
            hotspot: true,
          },
        },
      ],
    },
    {
      name: 'codeTemplate',
      title: 'Code Template',
      type: 'code',
      description: 'Starter code for the lesson exercise',
      options: {
        language: 'rust',
        languageAlternatives: [
          { title: 'Rust', value: 'rust' },
          { title: 'TypeScript', value: 'typescript' },
          { title: 'JavaScript', value: 'javascript' },
        ],
        withFilename: true,
      },
    },
    {
      name: 'solution',
      title: 'Solution',
      type: 'code',
      description: 'Reference solution (hidden from students)',
      options: {
        language: 'rust',
        languageAlternatives: [
          { title: 'Rust', value: 'rust' },
          { title: 'TypeScript', value: 'typescript' },
          { title: 'JavaScript', value: 'javascript' },
        ],
        withFilename: true,
      },
    },
    {
      name: 'testCases',
      title: 'Test Cases',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'testCase',
          fields: [
            {
              name: 'input',
              title: 'Input',
              type: 'string',
            },
            {
              name: 'expectedOutput',
              title: 'Expected Output',
              type: 'string',
            },
            {
              name: 'description',
              title: 'Description',
              type: 'string',
            },
            {
              name: 'hidden',
              title: 'Hidden Test',
              type: 'boolean',
              description: 'Hide this test from students',
              initialValue: false,
            },
          ],
        },
      ],
    },
    {
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      validation: (Rule: any) => Rule.required().min(0),
    },
    {
      name: 'duration',
      title: 'Estimated Duration',
      type: 'string',
      description: 'e.g., "15 minutes", "1 hour"',
    },
    {
      name: 'hints',
      title: 'Hints',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Progressive hints for students who get stuck',
    },
    {
      name: 'order',
      title: 'Lesson Order',
      type: 'number',
      description: 'Order within the course',
    },
  ],
  preview: {
    select: {
      title: 'title',
      order: 'order',
    },
    prepare(selection: any) {
      const { title, order } = selection;
      return {
        title: `${order !== undefined ? `${order}. ` : ''}${title}`,
      };
    },
  },
};
