/**
 * Sanity schema: Track document type.
 */
import { defineType, defineField } from 'sanity';

export default defineType({
    name: 'track',
    title: 'Track',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'name', maxLength: 96 },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'onChainTrackId',
            title: 'On-Chain Track ID',
            type: 'number',
            description: 'Maps to the on-chain trackId field in Course PDA',
            validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 2,
        }),
        defineField({
            name: 'icon',
            title: 'Icon (Emoji)',
            type: 'string',
        }),
        defineField({
            name: 'color',
            title: 'Color (Hex)',
            type: 'string',
            validation: (Rule) => Rule.regex(/^#[0-9A-Fa-f]{6}$/, { name: 'hex color' }),
        }),
    ],
    preview: {
        select: { title: 'name', icon: 'icon' },
        prepare({ title, icon }) {
            return { title: `${icon ?? ''} ${title}` };
        },
    },
});
