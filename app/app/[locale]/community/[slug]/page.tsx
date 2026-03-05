import { TopicView } from "@/components/community/TopicView";
import { getThreadBySlug } from "@/lib/actions/community";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TopicPage({
	params,
}: {
	params: Promise<{ slug: string; locale: string }>;
}) {
	const resolvedParams = await params;
	const topic = await getThreadBySlug(resolvedParams.slug);

	if (!topic) {
		notFound();
	}

	return <TopicView topic={topic} />;
}
