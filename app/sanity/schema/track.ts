import { defineType, defineField } from 'sanity'

export const track = defineType({
  name: 'track',
  title: 'Track',
  type: 'document',
  fields: [
    defineField({
      name: 'trackId',
      title: 'Track ID',
      type: 'number',
      description: 'Numeric ID matching on-chain course.track_id (e.g. 1, 2, 3)',
      validation: Rule => Rule.required().integer().min(1)
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text'
    }),
    defineField({
      name: 'image',
      title: 'Track Image',
      type: 'image',
      options: { hotspot: true }
    }),
    defineField({
      name: 'trackCollection',
      title: 'Track Collection (Metaplex Core)',
      type: 'string',
      description: 'Metaplex Core collection pubkey for credentials in this track',
      validation: Rule =>
        Rule.required().custom((value: string | undefined) => {
          if (!value || typeof value !== 'string') return 'Required'
          if (value.length < 32 || value.length > 44) return 'Invalid Solana pubkey length'
          return true
        })
    })
  ],
  preview: {
    select: { name: 'name', trackId: 'trackId' },
    prepare({ name, trackId }) {
      return {
        title: name || 'Untitled Track',
        subtitle: `Track ID: ${trackId ?? '—'}`
      }
    }
  }
})
