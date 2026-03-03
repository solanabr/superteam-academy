/**
 * Thread detail page — /community/[threadId]
 * Renders inside (routes) layout which provides sidebar + topbar.
 */
'use client';

import { use } from 'react';
import { ThreadDetailContent } from '@/components/community/ThreadDetailContent';

export default function ThreadDetailPage({ params }: { params: Promise<{ threadId: string }> }) {
    const { threadId } = use(params);
    return <ThreadDetailContent threadId={threadId} />;
}
