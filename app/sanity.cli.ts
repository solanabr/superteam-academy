/**
 * Sanity CLI configuration.
 *
 * Used by `npx sanity deploy` to build and deploy Studio
 * as a standalone app to <projectId>.sanity.studio.
 *
 * Deploy command: npx sanity deploy
 * This deploys Studio separately from the Next.js app for
 * origin isolation (recommended for production).
 */

import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
    api: {
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    },
});
