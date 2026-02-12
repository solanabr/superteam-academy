import { defineType, defineField } from 'sanity';

export const quiz = defineType({
  name: 'quiz',
  title: 'Quiz',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'questions',
      title: 'Questions',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {
            name: 'question',
            title: 'Question',
            type: 'text',
            validation: Rule => Rule.required()
          },
          {
            name: 'options',
            title: 'Options',
            type: 'array',
            of: [{ type: 'string' }],
            validation: Rule => Rule.required().min(2).max(6)
          },
          {
            name: 'correctAnswerIndex',
            title: 'Correct Answer Index',
            type: 'number',
            validation: Rule => Rule.required().min(0)
          },
          {
            name: 'explanation',
            title: 'Explanation',
            type: 'text'
          }
        ]
      }],
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'passingScore',
      title: 'Passing Score (%)',
      type: 'number',
      initialValue: 70,
      validation: Rule => Rule.required().min(0).max(100)
    })
  ],
  preview: {
    select: {
      title: 'title',
      questionsCount: 'questions.length'
    },
    prepare({ title, questionsCount }) {
      return {
        title,
        subtitle: `${questionsCount || 0} questions`
      };
    }
  }
});
