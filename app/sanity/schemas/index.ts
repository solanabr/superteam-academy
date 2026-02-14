// Export all Sanity schemas
// Import this in your sanity.config.ts

import course from './course';
import lesson from './lesson';
import track from './track';

export const schemaTypes = [course, lesson, track];
