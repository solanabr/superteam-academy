import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {schemaTypes} from './sanity/schemaTypes'

export default defineConfig({
  name: 'superteam_academy',
  title: 'Superteam Academy',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'msu3gmas',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [deskTool()],
  schema: {
    types: schemaTypes,
  },
})
