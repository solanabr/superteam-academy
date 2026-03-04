import { isAdmin } from '@/access/isAdmin'
import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'reviewerName',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      index: true,
    },
    {
      // Optional — null for seeded/anonymous reviews
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
    {
      // Display name used when no User relationship (seeded reviews)
      name: 'reviewerName',
      type: 'text',
      admin: {
        description: 'Display name for seeded or anonymous reviews',
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      maxLength: 1000,
      localized: true,
    },
    {
      // Human-readable relative date for seeded reviews ("2 weeks ago")
      name: 'displayDate',
      type: 'text',
      admin: {
        description:
          'Human-readable date for seeded reviews (e.g. "2 weeks ago")',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      defaultValue: 'pending',
      index: true,
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
}
