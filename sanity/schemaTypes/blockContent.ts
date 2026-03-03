import {defineType, defineField} from 'sanity'

export const blockContent = defineType({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  of: [
    {
      title: 'Block',
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Number', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Code', value: 'code'},
        ],
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
            ],
          },
        ],
      },
    },
    {
      type: 'image',
      options: {hotspot: true},
    },
    {
      title: 'Code Block',
      name: 'codeBlock',
      type: 'object',
      fields: [
        {
          title: 'Code',
          name: 'code',
          type: 'text',
        },
        {
          title: 'Language',
          name: 'language',
          type: 'string',
          options: {
            list: [
              {title: 'TypeScript', value: 'typescript'},
              {title: 'JavaScript', value: 'javascript'},
              {title: 'Rust', value: 'rust'},
              {title: 'Python', value: 'python'},
              {title: 'Bash', value: 'bash'},
              {title: 'JSON', value: 'json'},
            ],
          },
        },
      ],
    },
  ],
})
