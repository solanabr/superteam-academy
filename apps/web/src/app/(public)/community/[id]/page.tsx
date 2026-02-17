'use client';

import { useParams } from 'next/navigation';
import { ThreadDetail } from '@/components/community/thread-detail';

export default function ThreadPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="container py-8">
      <ThreadDetail threadId={params.id} />
    </div>
  );
}
