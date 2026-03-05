import { CreatorView } from "@/components/creator/CreatorView";
import { getSessionServer } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function CreatorPage() {
	const session = await getSessionServer();

	// Only authenticated wallets can enter the creator dashboard
	if (!session) {
		redirect("/");
	}

	return <CreatorView />;
}
