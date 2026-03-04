import { isAdmin, isAdminOrInstructor } from '@/access/isAdmin'
import type { CollectionConfig } from 'payload'

export const LessonContents: CollectionConfig = {
  slug: 'lesson-contents',
  admin: {
    useAsTitle: 'lesson',
  },
  access: {
    read: () => true,
    create: isAdminOrInstructor,
    update: isAdminOrInstructor,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'lesson',
      type: 'relationship',
      relationTo: 'lessons',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'blocks',
      type: 'array',
      admin: {
        description:
          'Ordered content blocks — mix markdown, video, and callouts',
      },
      fields: [
        {
          name: 'blockType',
          type: 'select',
          required: true,
          options: [
            { label: 'Markdown', value: 'markdown' },
            { label: 'Video', value: 'video' },
            { label: 'Callout', value: 'callout' },
          ],
        },
        {
          name: 'content',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'Markdown content or callout text',
            condition: (_data, siblingData) =>
              siblingData?.blockType === 'markdown' ||
              siblingData?.blockType === 'callout',
          },
        },
        {
          name: 'url',
          type: 'text',
          admin: {
            description: 'Video embed URL',
            condition: (_data, siblingData) =>
              siblingData?.blockType === 'video',
          },
        },
        {
          name: 'videoTitle',
          type: 'text',
          localized: true,
          admin: {
            condition: (_data, siblingData) =>
              siblingData?.blockType === 'video',
          },
        },
        {
          name: 'calloutVariant',
          type: 'select',
          options: [
            { label: 'Info', value: 'info' },
            { label: 'Warning', value: 'warning' },
            { label: 'Tip', value: 'tip' },
          ],
          admin: {
            condition: (_data, siblingData) =>
              siblingData?.blockType === 'callout',
          },
        },
      ],
    },
    {
      name: 'challenge',
      type: 'group',
      admin: { description: 'Code challenge config (optional)' },
      fields: [
        { name: 'prompt', type: 'textarea', localized: true },
        {
          name: 'objectives',
          type: 'array',
          fields: [
            {
              name: 'objective',
              type: 'text',
              required: true,
              localized: true,
            },
          ],
        },
        {
          name: 'starterCode',
          type: 'textarea',
          admin: { description: 'Pre-populated code for the challenge' },
        },
        {
          name: 'language',
          type: 'select',
          options: [
            { label: 'Rust', value: 'rust' },
            { label: 'TypeScript', value: 'typescript' },
            { label: 'JSON', value: 'json' },
          ],
        },
        {
          name: 'testCases',
          type: 'array',
          fields: [
            { name: 'name', type: 'text', required: true, localized: true },
            { name: 'expected', type: 'text', required: true },
          ],
        },
        { name: 'expectedOutput', type: 'text' },
        {
          name: 'solutionCode',
          type: 'textarea',
          admin: { description: 'Reference solution' },
        },
      ],
    },
    {
      name: 'quiz',
      type: 'group',
      admin: { description: 'Quiz config (optional)' },
      fields: [
        {
          name: 'questions',
          type: 'array',
          fields: [
            {
              name: 'questionType',
              type: 'select',
              required: true,
              options: [
                { label: 'Single Choice', value: 'radio' },
                { label: 'Multiple Choice', value: 'checkbox' },
                { label: 'Code', value: 'code' },
              ],
            },
            {
              name: 'prompt',
              type: 'textarea',
              required: true,
              localized: true,
            },
            {
              name: 'options',
              type: 'array',
              fields: [
                {
                  name: 'option',
                  type: 'text',
                  required: true,
                  localized: true,
                },
              ],
              admin: {
                condition: (_data, siblingData) =>
                  siblingData?.questionType === 'radio' ||
                  siblingData?.questionType === 'checkbox',
              },
            },
            {
              name: 'correctIndex',
              type: 'number',
              admin: {
                description: 'Zero-based index of correct answer (radio)',
                condition: (_data, siblingData) =>
                  siblingData?.questionType === 'radio',
              },
            },
            {
              name: 'correctIndices',
              type: 'json',
              admin: {
                description: 'Array of zero-based correct indices (checkbox)',
                condition: (_data, siblingData) =>
                  siblingData?.questionType === 'checkbox',
              },
            },
            {
              name: 'starterCode',
              type: 'textarea',
              admin: {
                condition: (_data, siblingData) =>
                  siblingData?.questionType === 'code',
              },
            },
            {
              name: 'language',
              type: 'text',
              admin: {
                condition: (_data, siblingData) =>
                  siblingData?.questionType === 'code',
              },
            },
            {
              name: 'expected',
              type: 'text',
              admin: {
                description: 'Expected code output',
                condition: (_data, siblingData) =>
                  siblingData?.questionType === 'code',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'hints',
      type: 'array',
      fields: [{ name: 'hint', type: 'text', required: true, localized: true }],
    },
    {
      name: 'solution',
      type: 'textarea',
      localized: true,
      admin: { description: 'Solution explanation or code' },
    },
  ],
}
