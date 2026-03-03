import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { codeInput } from '@sanity/code-input'
import { schemaTypes } from './studio/schemas'

export default defineConfig({
    name: 'default',
    title: 'Onchain Academy Studio',

    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    basePath: '/studio',

    plugins: [structureTool(), codeInput()],

    schema: {
        types: schemaTypes,
    },
})
