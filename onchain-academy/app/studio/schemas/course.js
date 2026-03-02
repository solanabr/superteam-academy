export default {
    name: 'course',
    title: 'Course',
    type: 'document',
    fields: [
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
        { name: 'description', title: 'Description', type: 'text' },
        { name: 'shortDescription', title: 'Short Description', type: 'string' },
        { name: 'thumbnail', title: 'Thumbnail', type: 'image' },
        {
            name: 'tags',
            title: 'Tags',
            type: 'array',
            of: [{ type: 'string' }]
        },
        {
            name: 'difficulty',
            title: 'Difficulty',
            type: 'string',
            options: { list: ['beginner', 'intermediate', 'advanced'] }
        },
        { name: 'topic', title: 'Topic', type: 'string' },
        {
            name: 'milestones',
            title: 'Milestones',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'milestone' }] }]
        },
        { name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }] },
        { name: 'track', title: 'Track', type: 'reference', to: [{ type: 'track' }] },
        { name: 'createdAt', title: 'Created At', type: 'datetime' },
        { name: 'totalXP', title: 'Total XP', type: 'number' },
        { name: 'duration', title: 'Duration (minutes)', type: 'number', description: 'Total estimated duration in minutes' },
        { name: 'enrollmentCount', title: 'Enrollment Count', type: 'number' },
    ]
}
