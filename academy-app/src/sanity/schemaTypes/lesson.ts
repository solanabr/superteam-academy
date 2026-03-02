import { defineField, defineType } from 'sanity'

export default defineType({
   name: 'lesson',
   title: 'Lesson',
   type: 'object',
   fields: [
      defineField({ name: 'lessonId', type: 'number', title: 'Lesson ID / Index' }),
      defineField({
         name: 'lessonType',
         type: 'number',
         title: 'Lesson Type',
         description: '1: VIDEO, 2: DOCUMENT, 3: CHALLENGE',
         options: {
            list: [
               { title: 'Video', value: 1 },
               { title: 'Document', value: 2 },
               { title: 'Challenge', value: 3 },
            ],
         },
      }),
      defineField({ name: 'materialUrl', type: 'url', title: 'Material URL' }),
   ],
})