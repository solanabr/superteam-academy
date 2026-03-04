import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import {
  Courses,
  LessonContents,
  Lessons,
  Media,
  Modules,
  Reviews,
  Streaks,
  Users,
} from './collections'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  localization: {
    locales: ['en', 'es', 'pt-br'],
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [
    Users,
    Courses,
    Modules,
    Lessons,
    LessonContents,
    Reviews,
    Streaks,
    Media,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-in-prod',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL!,
    },
    push: false,
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  admin: {
    user: Users.slug,
  },
})
