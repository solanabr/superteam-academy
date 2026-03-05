import { CommunityView } from "@/components/community/CommunityView";
import { getThreads } from "@/lib/actions/community";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
	const threads = await getThreads();
	return <CommunityView threads={threads || []} />;
}
