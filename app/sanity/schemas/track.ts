// Sanity schema for Track (Learning Path) documents
// Deploy this to your Sanity studio

export default {
  name: 'track',
  title: 'Learning Track',
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
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Lucide icon name (e.g., "code-2", "database")',
    },
    {
      name: 'color',
      title: 'Theme Color',
      type: 'string',
      description: 'Tailwind color class (e.g., "blue", "green")',
    },
    {
      name: 'courses',
      title: 'Courses',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'course' }],
        },
      ],
    },
    {
      name: 'credentialMetadata',
      title: 'Credential Metadata',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Credential Name',
          type: 'string',
        },
        {
          name: 'image',
          title: 'Credential Image',
          type: 'image',
        },
        {
          name: 'description',
          title: 'Credential Description',
          type: 'text',
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
      coursesCount: 'courses.length',
    },
    prepare(selection: any) {
      const { title, coursesCount } = selection;
      return {
        title,
        subtitle: coursesCount ? `${coursesCount} courses` : 'No courses',
      };
    },
  },
};
