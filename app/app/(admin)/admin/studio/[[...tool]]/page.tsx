/**
 * Embedded Sanity Studio — catch-all route.
 *
 * Renders the full Sanity Studio UI at /admin/studio.
 * Protected by the admin layout auth guard.
 *
 * Uses next-sanity's NextStudio component which handles:
 * - Studio initialization
 * - Dark mode styling
 * - Proper viewport configuration
 */

'use client';

import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity.config';

export default function StudioPage() {
    return <NextStudio config={config} />;
}
