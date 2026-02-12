import { defineType, defineField } from 'sanity';

export const codeChallenge = defineType({
  name: 'codeChallenge',
  title: 'Code Challenge',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'language',
      title: 'Programming Language',
      type: 'string',
      options: {
        list: [
          { title: 'TypeScript', value: 'typescript' },
          { title: 'JavaScript', value: 'javascript' },
          { title: 'Rust', value: 'rust' },
          { title: 'Python', value: 'python' },
          { title: 'Solidity', value: 'solidity' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'starterCode',
      title: 'Starter Code',
      type: 'code',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'solution',
      title: 'Solution Code',
      type: 'code',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'testCases',
      title: 'Test Cases',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {
            name: 'input',
            title: 'Input',
            type: 'text'
          },
          {
            name: 'expectedOutput',
            title: 'Expected Output',
            type: 'text'
          },
          {
            name: 'isHidden',
            title: 'Hidden Test Case',
            type: 'boolean',
            initialValue: false
          }
        ]
      }]
    }),
    defineField({
      name: 'hints',
      title: 'Hints',
      type: 'array',
      of: [{ type: 'text' }]
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      options: {
        list: [
          { title: 'Easy', value: 'easy' },
          { title: 'Medium', value: 'medium' },
          { title: 'Hard', value: 'hard' }
        ]
      }
    })
  ],
  preview: {
    select: {
      title: 'title',
      language: 'language',
      difficulty: 'difficulty'
    },
    prepare({ title, language, difficulty }) {
      return {
        title,
        subtitle: `${language} - ${difficulty}`
      };
    }
  }
});
