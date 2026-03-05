import { defineField, defineType } from 'sanity'

export default defineType({
   name: 'lesson',
   title: 'Lesson',
   type: 'object',
   fields: [
      defineField({ name: 'id', type: 'number', title: 'Lesson ID (Number)', validation: R => R.required() }),
      defineField({ name: 'title', type: 'string', validation: R => R.required() }),
      defineField({
         name: 'lessonType',
         type: 'number',
         title: 'Type of Content',
         options: {
            list: [
               { title: 'Video (External/Mux)', value: 1 },
               { title: 'Document (PDF/File)', value: 2 },
               { title: 'Coding Challenge', value: 3 },
            ],
            layout: 'radio'
         },
      }),

      // --- CONDITIONAL MEDIA FIELDS ---

      // Video: Only shows if Type is VIDEO (1)
      defineField({
         name: 'videoUrl',
         type: 'url',
         title: 'Video URL',
         hidden: ({ parent }) => parent?.lessonType !== 1,
      }),

      // Document: Only shows if Type is DOCUMENT (2)
      defineField({
         name: 'fileUpload',
         type: 'file',
         title: 'Upload Lesson File',
         hidden: ({ parent }) => parent?.lessonType !== 2,
         options: { accept: '.pdf,.zip,.docx' }
      }),

      // Challenge: Only shows if Type is CHALLENGE (3)
      defineField({
         name: 'objective',
         type: 'text',
         title: 'Challenge Objective',
         description: 'Clear instructions on what needs to be solved.',
         hidden: ({ parent }) => parent?.lessonType !== 3,
         rows: 3,
      }),
      defineField({
         name: 'starterCode',
         type: 'code',
         title: 'Starter Code',
         hidden: ({ parent }) => parent?.lessonType !== 3,
         options: {
            language: 'rust',
            languageAlternatives: [
               { title: 'Rust', value: 'rust' },
               { title: 'TypeScript', value: 'typescript' },
               { title: 'JavaScript', value: 'javascript' },
            ],
         },
      }),
      defineField({
         name: 'solutionCode',
         type: 'code',
         title: 'Solution Code',
         hidden: ({ parent }) => parent?.lessonType !== 3,
         options: {
            language: 'rust',
            languageAlternatives: [
               { title: 'Rust', value: 'rust' },
               { title: 'TypeScript', value: 'typescript' },
               { title: 'JavaScript', value: 'javascript' },
            ],
         },
      }),
      defineField({
         name: 'hints',
         type: 'array',
         title: 'Hints',
         hidden: ({ parent }) => parent?.lessonType !== 3,
         of: [{ type: 'string' }]
      }),

      // Used by document-type lessons for an alternative Markdown editing UX
      defineField({
         name: 'markdownContent',
         title: 'Markdown Content (document lessons)',
         type: 'markdown',
         hidden: ({ parent }) => parent?.lessonType !== 2,
      }),
      defineField({
         name: 'testCases',
         type: 'array',
         title: 'Test Cases & Expected Results',
         hidden: ({ parent }) => parent?.lessonType !== 3,
         of: [
            {
               type: 'object',
               fields: [
                  { name: 'input', type: 'string', title: 'Input' },
                  { name: 'expectedOutput', type: 'string', title: 'Expected Result' }
               ]
            }
         ]
      }),
   ],
})