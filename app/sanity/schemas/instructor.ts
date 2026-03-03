/**
 * Sanity schema: Instructor document type.
 */
import { defineType, defineField } from 'sanity';

export default defineType({
    name: 'instructor',
    title: 'Instructor',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'bio',
            title: 'Bio',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'avatar',
            title: 'Avatar',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'walletAddress',
            title: 'Wallet Address',
            type: 'string',
        }),
        defineField({
            name: 'socialLinks',
            title: 'Social Links',
            type: 'object',
            fields: [
                defineField({ name: 'twitter', title: 'Twitter', type: 'url' }),
                defineField({ name: 'github', title: 'GitHub', type: 'url' }),
                defineField({ name: 'website', title: 'Website', type: 'url' }),
            ],
        }),
    ],
    preview: {
        select: { title: 'name', media: 'avatar' },
    },
});
