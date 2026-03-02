import { defineField, defineType } from 'sanity'

export default defineType({
   name: 'track',
   title: 'Track',
   type: 'object',
   fields: [
      defineField({ name: 'trackId', type: 'number', title: 'Track ID' }),
      defineField({ name: 'trackName', type: 'string', title: 'Track Name' }),
      defineField({ name: 'trackLevel', type: 'number', title: 'Track Level' }),
   ],
})