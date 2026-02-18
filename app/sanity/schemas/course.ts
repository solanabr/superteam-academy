// Sanity schema for Course documents
// Deploy this to your Sanity studio

export default {
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'overview',
      title: 'Overview',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'level',
      title: 'Difficulty Level',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'duration',
      title: 'Estimated Duration',
      type: 'string',
      description: 'e.g., "4 hours", "2 weeks"',
    },
    {
      name: 'lessonsCount',
      title: 'Number of Lessons',
      type: 'number',
    },
    {
      name: 'studentsCount',
      title: 'Enrolled Students',
      type: 'number',
      initialValue: 0,
    },
    {
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (Rule: any) => Rule.min(0).max(5),
    },
    {
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      description: 'Total XP earned for completing the course',
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    },
    {
      name: 'image',
      title: 'Course Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'instructor',
      title: 'Instructor',
      type: 'string',
      initialValue: 'Superteam Brazil',
    },
    {
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'whatYouWillLearn',
      title: 'What You Will Learn',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'lesson' }],
        },
      ],
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    },
  ],
  preview: {
    select: {
      title: 'title',
      level: 'level',
      media: 'image',
    },
    prepare(selection: any) {
      const { title, level } = selection;
      return {
        title,
        subtitle: level ? `${level.charAt(0).toUpperCase()}${level.slice(1)}` : '',
        media: selection.media,
      };
    },
  },
};
