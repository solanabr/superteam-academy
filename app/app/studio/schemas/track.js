export default {
    name: 'track',
    title: 'Track',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            type: 'string',
        },
        {
            name: 'description',
            title: 'Description',
            type: 'text',
        },
        {
            name: 'color',
            title: 'Color',
            type: 'string',
            description: 'Hex color for the track (e.g. #3b82f6)',
        },
        {
            name: 'icon',
            title: 'Icon',
            type: 'string',
            description: 'Lucide icon name or emoji',
        },
    ],
}
