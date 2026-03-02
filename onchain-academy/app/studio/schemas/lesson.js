export default {
    name: 'lesson',
    title: 'Lesson',
    type: 'document',
    fields: [
        { name: 'title', title: 'Title', type: 'string' },
        {
            name: 'type',
            title: 'Type',
            type: 'string',
            options: { list: ['video', 'reading', 'challenge'] }
        },
        { name: 'order', title: 'Order', type: 'number' },
        { name: 'duration', title: 'Duration (minutes)', type: 'number' },
        { name: 'videoUrl', title: 'Video URL', type: 'url', hidden: ({ parent }) => parent?.type !== 'video' },
        { name: 'content', title: 'Content', type: 'blockContent', hidden: ({ parent }) => parent?.type === 'video' },
        {
            name: 'challenge',
            title: 'Challenge',
            type: 'object',
            hidden: ({ parent }) => parent?.type !== 'challenge',
            fields: [
                { name: 'instructions', title: 'Instructions', type: 'blockContent' },
                { name: 'initialCode', title: 'Initial Code', type: 'code', options: { language: 'rust' } },
                { name: 'solution', title: 'Solution', type: 'code', options: { language: 'rust' } },
            ]
        }
    ]
}
