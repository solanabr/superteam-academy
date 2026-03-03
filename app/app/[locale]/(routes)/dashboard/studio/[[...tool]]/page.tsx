/**
 * Instructor Studio — embedded Sanity Studio for course content management.
 *
 * Same Sanity Studio as the admin version, but accessible to instructors
 * from their dashboard. Protected by the dashboard route guard (auth required).
 *
 * Note: Sanity handles its own document-level permissions.
 * Instructors can create/edit content, but publishing may require admin approval
 * depending on the Sanity workspace configuration.
 */

'use client';

import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity.config';

export default function InstructorStudioPage() {
    return (
        <div style={{ height: 'calc(100vh - 64px)' }}>
            <NextStudio config={config} />
        </div>
    );
}
