export default {
    name: 'course',
    title: 'Course',
    type: 'document',
    fields: [
        { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
        { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (Rule) => Rule.required() },
        { name: 'description', title: 'Description', type: 'text', validation: (Rule) => Rule.required() },
        {
            name: 'shortDescription',
            title: 'Short Description',
            type: 'string',
            validation: (Rule) => Rule.required().max(160),
            description: 'Max 160 characters — shown in course cards',
        },
        { name: 'thumbnail', title: 'Thumbnail', type: 'image', options: { hotspot: true } },
        {
            name: 'tags',
            title: 'Tags',
            type: 'array',
            of: [{ type: 'string' }],
            options: { layout: 'tags' },
        },
        {
            name: 'difficulty',
            title: 'Difficulty',
            type: 'string',
            options: {
                list: [
                    { title: 'Beginner', value: 'beginner' },
                    { title: 'Intermediate', value: 'intermediate' },
                    { title: 'Advanced', value: 'advanced' },
                ],
            },
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'topic',
            title: 'Topic',
            type: 'string',
            options: {
                list: [
                    { title: 'Solana Basics', value: 'solana-basics' },
                    { title: 'Smart Contracts', value: 'smart-contracts' },
                    { title: 'DeFi', value: 'defi' },
                    { title: 'NFTs', value: 'nfts' },
                    { title: 'Tokens', value: 'tokens' },
                    { title: 'Web3 Frontend', value: 'web3-frontend' },
                    { title: 'Security', value: 'security' },
                    { title: 'Tooling', value: 'tooling' },
                ],
            },
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'status',
            title: 'Status',
            type: 'string',
            options: {
                list: [
                    { title: 'Draft', value: 'draft' },
                    { title: 'Published', value: 'published' },
                    { title: 'Archived', value: 'archived' },
                ],
            },
            initialValue: 'draft',
        },
        {
            name: 'milestones',
            title: 'Milestones',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'milestone' }] }],
            validation: (Rule) => Rule.required().min(1),
        },
        { name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }], validation: (Rule) => Rule.required() },
        { name: 'track', title: 'Track', type: 'reference', to: [{ type: 'track' }] },
        { name: 'totalXP', title: 'Total XP', type: 'number', description: 'Auto-calculated on sync — leave empty' },
        { name: 'duration', title: 'Duration (minutes)', type: 'number', description: 'Auto-calculated on sync — leave empty' },
    ],
    preview: {
        select: { title: 'title', difficulty: 'difficulty', status: 'status', media: 'thumbnail' },
        prepare({ title, difficulty, status, media }) {
            const statusIcons = { draft: '📝', published: '✅', archived: '📦' }
            return {
                title: title || 'Untitled Course',
                subtitle: `${statusIcons[status] || '📝'} ${status || 'draft'} — ${difficulty || 'unknown'}`,
                media,
            }
        },
    },
}
