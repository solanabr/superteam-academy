import { isAdmin } from '@/access/isAdmin'
import type { Access, CollectionConfig } from 'payload'

const canCreateOwnXP: Access = ({ req: { user } }) => {
  if (!user) return false

  return {
    user: {
      equals: user.id,
    },
  }
}

export const XpRecords: CollectionConfig = {
  slug: 'xp-records',
  admin: {
    useAsTitle: 'id',
  },
  access: {
    read: () => true,
    create: canCreateOwnXP,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      validate: (val: number | number[] | null | undefined) => {
        if (val == null) return true
        if (Array.isArray(val)) {
          const invalid = val.some((v) => typeof v === 'number' && v < 0)
          return invalid ? 'Amount must be non-negative' : true
        }
        if (val < 0) return 'Amount must be non-negative'
        return true
      },
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        description:
          'Activity that earned XP (e.g., "lesson-complete", "quiz-passed")',
      },
    },
  ],
}
