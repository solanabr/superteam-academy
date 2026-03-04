import { isAdmin, isAdminOrInstructor } from '@/access/isAdmin'
import type { CollectionConfig } from 'payload'

export const Lessons: CollectionConfig = {
  slug: 'lessons',
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
      name: 'module',
      type: 'relationship',
      relationTo: 'modules',
      required: true,
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Video', value: 'video' },
        { label: 'Reading', value: 'reading' },
        { label: 'Code Challenge', value: 'code_challenge' },
        { label: 'Quiz', value: 'quiz' },
        { label: 'Hybrid', value: 'hybrid' },
      ],
    },
    {
      name: 'duration',
      type: 'text',
      admin: { description: 'e.g. "15 min"' },
    },
    {
      name: 'xpReward',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'sortOrder',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { description: 'Order within the module (0, 1, 2…)' },
    },
    {
      name: 'onChainLessonIndex',
      type: 'number',
      admin: { description: 'Maps to the bitmap index in on-chain Enrollment' },
    },
  ],
}
