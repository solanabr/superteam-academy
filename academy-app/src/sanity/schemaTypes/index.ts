import { type SchemaTypeDefinition } from 'sanity'
import track from './track'
import lesson from './lesson'
import course from './course'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [track, lesson, course],
}
