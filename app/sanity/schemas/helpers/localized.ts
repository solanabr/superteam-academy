import { defineField } from 'sanity';

export function localizedString(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'object',
    fields: [
      { name: 'en', type: 'string', title: 'English' },
      { name: 'pt', type: 'string', title: 'Portuguese' },
      { name: 'es', type: 'string', title: 'Spanish' },
    ],
  });
}

export function localizedText(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'object',
    fields: [
      { name: 'en', type: 'text', title: 'English' },
      { name: 'pt', type: 'text', title: 'Portuguese' },
      { name: 'es', type: 'text', title: 'Spanish' },
    ],
  });
}

export function localizedBlock(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'object',
    fields: [
      {
        name: 'en',
        type: 'array',
        title: 'English',
        of: [{ type: 'block' }],
      },
      {
        name: 'pt',
        type: 'array',
        title: 'Portuguese',
        of: [{ type: 'block' }],
      },
      {
        name: 'es',
        type: 'array',
        title: 'Spanish',
        of: [{ type: 'block' }],
      },
    ],
  });
}
