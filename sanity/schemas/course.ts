import { defineType, defineField } from 'sanity';

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'longDescription',
      title: 'Long Description',
      type: 'array',
      of: [{ type: 'block' }]
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' }
        ],
        layout: 'radio'
      }
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Blockchain Basics', value: 'blockchain-basics' },
          { title: 'Solana Development', value: 'solana-development' },
          { title: 'Smart Contracts', value: 'smart-contracts' },
          { title: 'DeFi', value: 'defi' },
          { title: 'NFTs', value: 'nfts' },
          { title: 'Web3', value: 'web3' }
        ]
      }
    }),
    defineField({
      name: 'estimatedHours',
      title: 'Estimated Hours',
      type: 'number',
      validation: Rule => Rule.min(0)
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      of: [{ type: 'string' }]
    }),
    defineField({
      name: 'learningOutcomes',
      title: 'Learning Outcomes',
      type: 'array',
      of: [{ type: 'string' }]
    }),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'lesson' }] }]
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime'
    })
  ],
  preview: {
    select: {
      title: 'title',
      difficulty: 'difficulty',
      media: 'thumbnail'
    },
    prepare({ title, difficulty, media }) {
      return {
        title,
        subtitle: difficulty,
        media
      };
    }
  }
});
