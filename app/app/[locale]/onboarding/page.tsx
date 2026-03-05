/**
 * @fileoverview Mandatory onboarding page.
 * Gated by session and onboarding status; ensures users complete their profile before dashboard access.
 */
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { OnboardingView } from "@/components/onboarding/OnboardingView";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

/**
 * The Onboarding Page component.
 * Performs server-side checks for authentication and existing onboarding status.
 */
export default async function OnboardingPage() {
	const [session, locale] = await Promise.all([
		auth.api.getSession({ headers: await headers() }),
		getLocale(),
	]);

	// Not logged in → go to auth
	if (!session?.user?.id) {
		redirect(`/${locale}/auth`);
	}

	// Already onboarded → go to dashboard
	const dbUser = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
	});

	if (dbUser?.onboardingCompleted === true) {
		redirect(`/${locale}/dashboard`);
	}

	return <OnboardingView />;
}
