export default {
    name: 'quiz',
    title: 'Quiz',
    type: 'document',
    fields: [
        { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
        {
            name: 'passThreshold',
            title: 'Pass Threshold (%)',
            type: 'number',
            initialValue: 80,
            validation: (Rule) => Rule.required().min(0).max(100),
        },
        {
            name: 'points',
            title: 'Points',
            type: 'number',
            initialValue: 100,
            description: 'Weight within the milestone (sums to 100)',
            validation: (Rule) => Rule.required().min(1),
        },
        {
            name: 'questions',
            title: 'Questions',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'quizQuestion',
                    title: 'Quiz Question',
                    fields: [
                        {
                            name: 'question',
                            title: 'Question',
                            type: 'text',
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: 'options',
                            title: 'Options',
                            type: 'array',
                            of: [
                                {
                                    type: 'object',
                                    name: 'quizOption',
                                    title: 'Option',
                                    fields: [
                                        {
                                            name: 'label',
                                            title: 'Label',
                                            type: 'string',
                                            validation: (Rule) => Rule.required(),
                                        },
                                        {
                                            name: 'isCorrect',
                                            title: 'Is Correct?',
                                            type: 'boolean',
                                            initialValue: false,
                                        },
                                    ],
                                    preview: {
                                        select: { title: 'label', isCorrect: 'isCorrect' },
                                        prepare({ title, isCorrect }) {
                                            return {
                                                title: `${isCorrect ? '✅' : '❌'} ${title}`,
                                            }
                                        },
                                    },
                                },
                            ],
                            validation: (Rule) => Rule.required().min(2),
                        },
                        {
                            name: 'explanation',
                            title: 'Explanation',
                            type: 'text',
                            description: 'Shown after answering — teaches the why',
                        },
                    ],
                    preview: {
                        select: { title: 'question' },
                        prepare({ title }) {
                            return {
                                title: title?.substring(0, 80) || 'Untitled question',
                            }
                        },
                    },
                },
            ],
            validation: (Rule) => Rule.required().min(1),
        },
    ],
    preview: {
        select: { title: 'title', questions: 'questions' },
        prepare({ title, questions }) {
            return {
                title: title || 'Untitled Quiz',
                subtitle: `${questions?.length || 0} questions`,
            }
        },
    },
}
