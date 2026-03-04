export default {
  name: 'track',
  title: 'Learning Track',
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
      name: 'description', 
      title: 'Description', 
      type: 'text' 
    },
    { 
      name: 'icon', 
      title: 'Icon Name', 
      type: 'string', 
      description: 'Lucide icon name' 
    },
    { 
      name: 'order', 
      title: 'Sort Order', 
      type: 'number', 
      validation: (Rule) => Rule.required() 
    },
  ],
}
