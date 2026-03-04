export default {
  name: 'landingPage',
  title: 'Landing Page',
  type: 'document',
  fields: [
    { 
      name: 'heroTitle', 
      title: 'Hero Title', 
      type: 'string' 
    },
    { 
      name: 'heroSubtitle', 
      title: 'Hero Subtitle', 
      type: 'text' 
    },
    { 
      name: 'features', 
      title: 'Feature Highlights', 
      type: 'array', 
      of: [
        { 
          type: 'object', 
          fields: [
            { name: 'title', type: 'string' },
            { name: 'description', type: 'text' },
            { name: 'icon', type: 'string' },
          ]
        }
      ]
    },
    { 
      name: 'testimonials', 
      title: 'Testimonials', 
      type: 'array', 
      of: [
        { 
          type: 'object', 
          fields: [
            { name: 'name', type: 'string' },
            { name: 'role', type: 'string' },
            { name: 'quote', type: 'text' },
            { name: 'avatar', type: 'image' },
          ]
        }
      ]
    },
    { 
      name: 'stats', 
      title: 'Stats', 
      type: 'array', 
      of: [
        { 
          type: 'object', 
          fields: [
            { name: 'label', type: 'string' },
            { name: 'value', type: 'string' },
          ]
        }
      ]
    },
  ],
}
