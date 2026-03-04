export default {
  name: 'module',
  title: 'Module',
  type: 'document',
  fields: [
    { 
      name: 'title', 
      title: 'Title', 
      type: 'string', 
      validation: (Rule) => Rule.required() 
    },
    { 
      name: 'order', 
      title: 'Sort Order', 
      type: 'number', 
      validation: (Rule) => Rule.required() 
    },
    { 
      name: 'lessons', 
      title: 'Lessons', 
      type: 'array', 
      of: [{ type: 'reference', to: [{ type: 'lesson' }] }] 
    },
  ],
}
