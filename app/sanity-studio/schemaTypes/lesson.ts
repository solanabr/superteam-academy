export default {
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    { 
      name: 'title', 
      title: 'Title', 
      type: 'string', 
      validation: (Rule) => Rule.required() 
    },
    { 
      name: 'slug', 
      title: 'Slug', 
      type: 'slug', 
      options: { source: 'title' }, 
      validation: (Rule) => Rule.required() 
    },
    { 
      name: 'type', 
      title: 'Type', 
      type: 'string', 
      options: { 
        list: ['content', 'challenge'] 
      }, 
      validation: (Rule) => Rule.required() 
    },
    { 
      name: 'body', 
      title: 'Content', 
      type: 'array', 
      of: [
        { type: 'block' }, 
        { type: 'image' }
      ] 
    },
    { 
      name: 'estimatedMinutes', 
      title: 'Estimated Minutes', 
      type: 'number' 
    },
    { 
      name: 'xpReward', 
      title: 'XP Reward', 
      type: 'number' 
    },
    { 
      name: 'order', 
      title: 'Sort Order', 
      type: 'number', 
      validation: (Rule) => Rule.required() 
    },
    { 
      name: 'starterCode', 
      title: 'Starter Code', 
      type: 'text', 
      description: 'For challenge-type lessons' 
    },
    { 
      name: 'solutionCode', 
      title: 'Solution Code', 
      type: 'text' 
    },
    { 
      name: 'expectedOutput', 
      title: 'Expected Output', 
      type: 'text' 
    },
    { 
      name: 'hints', 
      title: 'Hints', 
      type: 'array', 
      of: [{ type: 'string' }] 
    },
  ],
}
