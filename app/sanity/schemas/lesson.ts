export const lessonSchema = {
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'content', title: 'Content', type: 'array', of: [{ type: 'block' }] },
    { name: 'videoUrl', title: 'Video URL', type: 'url' },
    { name: 'xp', title: 'XP Reward', type: 'number' },
    { name: 'order', title: 'Order', type: 'number' },
  ],
} as const;
