import { redirect } from "next/navigation";
import { CreatorView } from "@/components/creator/CreatorView";
import { getSessionServer } from "@/lib/auth/server";

export default async function CreatorPage() {
	const session = await getSessionServer();

	// Only authenticated wallets can enter the creator dashboard
	if (!session) {
		redirect("/");
	}

	return <CreatorView />;
}
