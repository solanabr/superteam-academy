export default {
  name: 'course',
  title: 'Course',
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
      name: 'onChainCourseId',
      title: 'On-Chain Course ID',
      type: 'string',
      description: 'Stable ID used for on-chain PDAs (max 32 bytes). Example: solana-fundamentals-v1',
      validation: (Rule) => Rule.max(32).warning('Must be <= 32 characters/bytes for PDA seeds'),
    },
    { 
      name: 'description', 
      title: 'Description', 
      type: 'text', 
      validation: (Rule) => Rule.required() 
    },
    { 
      name: 'difficulty', 
      title: 'Difficulty', 
      type: 'string', 
      options: { 
        list: ['beginner', 'intermediate', 'advanced'] 
      } 
    },
    { 
      name: 'duration', 
      title: 'Duration', 
      type: 'string', 
      description: 'e.g. "4 hours"' 
    },
    { 
      name: 'xpReward', 
      title: 'Total XP Reward', 
      type: 'number' 
    },
    { 
      name: 'thumbnail', 
      title: 'Thumbnail', 
      type: 'image', 
      options: { hotspot: true } 
    },
    { 
      name: 'track', 
      title: 'Track', 
      type: 'reference', 
      to: [{ type: 'track' }] 
    },
    { 
      name: 'prerequisites', 
      title: 'Prerequisites', 
      type: 'array', 
      of: [{ type: 'string' }] 
    },
    { 
      name: 'tags', 
      title: 'Tags', 
      type: 'array', 
      of: [{ type: 'string' }] 
    },
    { 
      name: 'modules', 
      title: 'Modules', 
      type: 'array', 
      of: [{ type: 'reference', to: [{ type: 'module' }] }] 
    },
    { 
      name: 'order', 
      title: 'Sort Order', 
      type: 'number' 
    },
  ],
}
