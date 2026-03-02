export default {
    name: 'milestone',
    title: 'Milestone',
    type: 'document',
    fields: [
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
        { name: 'order', title: 'Order', type: 'number' },
        { name: 'xpReward', title: 'XP Reward', type: 'number' },
        {
            name: 'lessons',
            title: 'Lessons',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'lesson' }] }]
        }
    ]
}
