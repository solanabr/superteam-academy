export default {
    name: 'milestone',
    title: 'Milestone',
    type: 'document',
    fields: [
        { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
        { name: 'description', title: 'Description', type: 'text' },
        {
            name: 'order',
            title: 'Order',
            type: 'number',
            validation: (Rule) => Rule.required().min(1).max(5),
        },
        {
            name: 'xpReward',
            title: 'XP Reward',
            type: 'number',
            initialValue: 100,
            validation: (Rule) => Rule.required().min(1),
        },
        {
            name: 'lessons',
            title: 'Lessons',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'lesson' }] }],
            validation: (Rule) => Rule.required().min(1).max(5),
        },
        {
    name: 'tests',
    title: 'Tests',
    type: 'array',
    description: 'Add quizzes or code challenges for this milestone',
    of: [
        { type: 'reference', to: [{ type: 'quiz' }, { type: 'codeChallenge' }] },
    ],
    validation: (Rule) => Rule.required().min(1),
},
    ],
    preview: {
        select: { title: 'title', order: 'order' },
        prepare({ title, order }) {
            return {
                title: `${order ? `#${order} — ` : ''}${title || 'Untitled Milestone'}`,
            }
        },
    },
}
