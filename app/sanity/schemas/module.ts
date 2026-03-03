/**
 * Sanity schema: Module document type.
 */
import { defineType, defineField } from 'sanity';

export default defineType({
    name: 'module',
    title: 'Module',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule) => Rule.required().max(120),
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 2,
        }),
        defineField({
            name: 'order',
            title: 'Order',
            type: 'number',
            validation: (Rule) => Rule.required().min(0),
        }),
        defineField({
            name: 'lessons',
            title: 'Lessons',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'lesson' }] }],
        }),
    ],
    orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
    preview: {
        select: { title: 'title', order: 'order' },
        prepare({ title, order }) {
            return { title: `${order ?? '?'}. ${title}` };
        },
    },
});
