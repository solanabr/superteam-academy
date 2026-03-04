import { isAdmin, isAdminOrInstructor } from '@/access/isAdmin'
import { slugify } from '@/hooks/courses.hooks'
import type { CollectionConfig } from 'payload'

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
    create: isAdminOrInstructor,
    update: isAdminOrInstructor,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [slugify],
  },
  fields: [
    // ─── Core ────────────────────────────────────────────────────
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from title if left blank',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      maxLength: 300,
      localized: true,
    },
    {
      name: 'longDescription',
      type: 'richText',
      localized: true,
    },
    {
      name: 'difficulty',
      type: 'select',
      required: true,
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
      index: true,
    },
    {
      name: 'duration',
      type: 'text',
      admin: { description: 'e.g. "8 hours"' },
    },
    {
      name: 'totalLessons',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Computed and updated by seed script' },
    },
    {
      name: 'xpReward',
      type: 'number',
      required: true,
      min: 0,
      admin: { description: 'Total XP earnable for completing this course' },
    },
    {
      name: 'topic',
      type: 'text',
      index: true,
      admin: { description: 'e.g. "Core", "DeFi", "Security", "NFTs"' },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    // ─── Learning Outcomes & Prerequisites ───────────────────────
    {
      name: 'learningOutcomes',
      type: 'array',
      fields: [
        { name: 'outcome', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'prerequisites',
      type: 'array',
      fields: [
        { name: 'prerequisite', type: 'text', required: true, localized: true },
      ],
    },
    // ─── Social Proof / Display Meta ─────────────────────────────
    {
      name: 'enrollmentCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of enrolled learners (seeded + live count)',
      },
    },
    {
      name: 'rating',
      type: 'number',
      min: 0,
      max: 5,
      defaultValue: 0,
      admin: { description: 'Average rating (0–5, 1 decimal)' },
    },
    {
      name: 'ratingCount',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Total number of ratings submitted' },
    },
    {
      name: 'lastUpdated',
      type: 'text',
      admin: { description: 'Human-readable update date, e.g. "Feb 2025"' },
    },
    {
      name: 'language',
      type: 'text',
      defaultValue: 'English',
      admin: { description: 'Primary content language' },
    },
    // ─── On-chain / Meta ─────────────────────────────────────────
    {
      name: 'trackId',
      type: 'number',
      admin: { description: 'Maps to on-chain track ID' },
    },
    {
      name: 'trackLevel',
      type: 'number',
      admin: { description: 'Level within the track' },
    },
    {
      name: 'onChainCourseId',
      type: 'text',
      index: true,
      admin: { description: 'Course PDA seed (e.g. "anchor-101")' },
    },
    {
      name: 'instructor',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      index: true,
    },
    {
      name: 'certificate',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'onChainCredential',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
