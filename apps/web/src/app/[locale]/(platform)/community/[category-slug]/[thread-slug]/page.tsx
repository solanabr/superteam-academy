import { ThreadDetailClient } from "./thread-detail-client";

interface ThreadDetailPageProps {
  params: Promise<{ "category-slug": string; "thread-slug": string }>;
}

export default async function ThreadDetailPage({
  params,
}: ThreadDetailPageProps) {
  const { "thread-slug": threadSlug } = await params;

  // Extract short_id: always last 8 chars (appended by create_thread as -{short_id})
  const shortId = threadSlug.slice(-8);

  return <ThreadDetailClient shortId={shortId} />;
}
