import { defineType, defineField } from 'sanity';

export const challenge = defineType({
  name: 'challenge',
  title: 'Challenge',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'prompt',
      title: 'Prompt',
      type: 'text',
      rows: 6,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'starterCode',
      title: 'Starter Code',
      type: 'text',
      rows: 10,
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          { title: 'Rust', value: 'rust' },
          { title: 'TypeScript', value: 'typescript' },
          { title: 'JavaScript', value: 'javascript' },
          { title: 'JSON', value: 'json' },
        ],
      },
      initialValue: 'typescript',
    }),
    defineField({
      name: 'testCases',
      title: 'Test Cases',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Test Name', type: 'string' }),
            defineField({ name: 'input', title: 'Input', type: 'text' }),
            defineField({ name: 'expectedOutput', title: 'Expected Output', type: 'text' }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'language' },
  },
});
