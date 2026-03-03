/**
 * Sanity Studio configuration.
 *
 * Registers all document schemas and configures the embedded studio.
 * Used by both next-sanity's NextStudio component and the Sanity CLI.
 */

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { codeInput } from '@sanity/code-input';
import { markdownSchema } from 'sanity-plugin-markdown';
import { schemaTypes } from './sanity/schemas';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export default defineConfig({
    name: 'superteam-academy',
    title: 'Superteam Academy',

    projectId,
    dataset,

    plugins: [structureTool(), codeInput(), markdownSchema()],

    schema: {
        types: schemaTypes,
    },
});
