/**
 * @fileoverview Settings page component.
 * Serves as the entry point for the settings view within the localized route.
 */
import { SettingsView } from "@/components/settings/SettingsView";
import { getSessionServer } from "@/lib/auth/server";
import { getPostHogClient } from "@/lib/posthog-server";

export default async function SettingsPage() {
	const session = await getSessionServer();
	const posthog = getPostHogClient();

	posthog.capture({
		distinctId: session?.user?.id || "anonymous",
		event: "settings_viewed",
	});

	if (session?.user?.id) {
		await posthog.shutdown();
	}

	return <SettingsView />;
}
