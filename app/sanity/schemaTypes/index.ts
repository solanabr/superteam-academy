import { type SchemaTypeDefinition } from 'sanity'

import { instructor } from './instructor'
import { lesson } from './lesson'
import { courseModule } from './module'
import { course } from './course'
import { game } from './game'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [instructor, lesson, courseModule, course, game],
}
