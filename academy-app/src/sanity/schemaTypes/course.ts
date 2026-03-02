import { defineField, defineType } from 'sanity'

export default defineType({
   name: 'course',
   title: 'Course',
   type: 'document',
   fields: [
      defineField({ name: 'courseId', type: 'string', title: 'Course ID' }),
      defineField({ name: 'courseName', type: 'string', title: 'Course Name' }),
      defineField({
         name: 'creator',
         title: 'Creator Information',
         type: 'object',
         fields: [
            defineField({
               name: 'creatorName',
               type: 'string',
               title: 'Creator Name',
               validation: Rule => Rule.required()
            }),
            defineField({
               name: 'creatorPublicKey',
               type: 'string',
               title: 'Solana Public Key',
               description: 'The wallet address of the course creator',
               validation: Rule => Rule.required().min(32).max(44) // Basic Solana address length validation
            }),
         ]
      }),
      defineField({
         name: 'difficulty',
         type: 'string',
         title: 'Difficulty',
         options: {
            list: [
               { title: 'Beginner', value: 'BEGINNER' },
               { title: 'Intermediate', value: 'INTERMEDIATE' },
               { title: 'Advanced', value: 'ADVANCED' },
            ]
         }
      }),
      defineField({
         name: 'lessons',
         type: 'array',
         title: 'Lessons',
         of: [{ type: 'lesson' }],
      }),
      defineField({
         name: 'lessonCount',
         type: 'number',
         title: 'Lesson Count',
         readOnly: true, // You can calculate this in the frontend or via a hook
      }),
      defineField({ name: 'xpPerLesson', type: 'number', title: 'XP Per Lesson' }),
      defineField({ name: 'track', type: 'track', title: 'Track Info' }),
      defineField({
         name: 'prerequisite',
         type: 'array',
         title: 'Prerequisites',
         of: [{ type: 'reference', to: [{ type: 'course' }] }],
      }),
      defineField({ name: 'creatorRewardXp', type: 'number', title: 'Creator Reward XP' }),
      defineField({ name: 'minCompletionsForReward', type: 'number', title: 'Min Completions' }),
   ],
})