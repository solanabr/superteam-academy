import { type SchemaTypeDefinition } from 'sanity'

import author from './author'
import course from './course'
import lesson from './lesson'
import module from './module'

export const schema: { types: SchemaTypeDefinition[] } = {
    types: [author, course, module, lesson],
}
