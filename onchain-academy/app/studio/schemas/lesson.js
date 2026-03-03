export default {
    name: 'lesson',
    title: 'Lesson',
    type: 'document',
    fields: [
        { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
        {
            name: 'type',
            title: 'Type',
            type: 'string',
            options: {
                list: [
                    { title: 'Video', value: 'video' },
                    { title: 'Document', value: 'document' },
                    { title: 'Text', value: 'text' },
                ],
            },
            validation: (Rule) => Rule.required(),
        },
        { name: 'order', title: 'Order', type: 'number', validation: (Rule) => Rule.required() },
        {
            name: 'duration',
            title: 'Duration (minutes)',
            type: 'number',
            initialValue: 8,
            description: 'Estimated duration in minutes',
        },
        {
            name: 'url',
            title: 'URL',
            type: 'url',
            description: 'Video URL or document link',
            hidden: ({ parent }) => parent?.type === 'text',
        },
        {
            name: 'content',
            title: 'Content',
            type: 'blockContent',
            description: 'Rich text content for text-type lessons',
            hidden: ({ parent }) => parent?.type !== 'text',
        },
    ],
    preview: {
        select: { title: 'title', type: 'type', order: 'order' },
        prepare({ title, type, order }) {
            const icons = { video: '🎬', document: '📄', text: '📝' }
            return {
                title: `${order ? `${order}. ` : ''}${title || 'Untitled Lesson'}`,
                subtitle: `${icons[type] || '📄'} ${type || 'unknown'}`,
            }
        },
    },
}
