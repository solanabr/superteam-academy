import { isAdmin, isAdminOrInstructor } from '@/access/isAdmin'
import type { CollectionConfig } from 'payload'

export const Modules: CollectionConfig = {
  slug: 'modules',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
    create: isAdminOrInstructor,
    update: isAdminOrInstructor,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      index: true,
    },
    {
      name: 'sortOrder',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { description: 'Order within the course (0, 1, 2…)' },
    },
  ],
}
