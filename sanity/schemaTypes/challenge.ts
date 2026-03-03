import {defineField, defineType} from 'sanity'

export const challenge = defineType({
  name: 'challenge',
  title: 'Code Challenge',
  type: 'object',
  fields: [
    defineField({
      name: 'prompt',
      title: 'Challenge Prompt',
      type: 'text',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'starterCode',
      title: 'Starter Code',
      type: 'text',
      description: 'Pre-filled code for the challenge',
    }),
    defineField({
      name: 'solution',
      title: 'Solution',
      type: 'text',
      description: 'Reference solution (hidden from learners)',
    }),
    defineField({
      name: 'testCases',
      title: 'Test Cases',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'input',
              type: 'string',
              title: 'Input',
            },
            {
              name: 'expectedOutput',
              type: 'string',
              title: 'Expected Output',
            },
            {
              name: 'hidden',
              type: 'boolean',
              title: 'Hidden (not shown to learner)',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'language',
      title: 'Programming Language',
      type: 'string',
      options: {
        list: [
          {title: 'TypeScript', value: 'typescript'},
          {title: 'Rust', value: 'rust'},
          {title: 'Python', value: 'python'},
          {title: 'JavaScript', value: 'javascript'},
        ],
      },
    }),
    defineField({
      name: 'hints',
      title: 'Hints',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Helpful hints for learners',
    }),
  ],
})
