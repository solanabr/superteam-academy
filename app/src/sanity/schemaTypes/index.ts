import { type SchemaTypeDefinition } from 'sanity';

import track from './track';
import instructor from './instructor';
import course from './course';
import lesson from './lesson';
import achievement from './achievement';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [track, instructor, course, lesson, achievement],
};
