/**
 * @fileoverview Client-side onboarding guard.
 * Monitors the authenticated user's session and redirects them to the onboarding
 * flow if it hasn't been completed yet.
 */
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { useSession } from "@/lib/auth/client";

/**
 * Guard component that enforces onboarding completion.
 * Place this in the root layout to protect the entire application.
 */
export function OnboardingGuard() {
	const { data: session, isPending } = useSession();
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		if (isPending) return;

		// If not logged in, we don't force onboarding (Auth Guard handles login)
		if (!session) return;

		// Strict typing for the user object including Better Auth additional fields
		const user = session.user as typeof session.user & {
			onboardingCompleted?: boolean;
			onboarding_completed?: boolean; // Support potential Better Auth naming variations
		};

		// Handle potential naming variations and ensure boolean comparison
		const isOnboarded =
			user?.onboardingCompleted === true || user?.onboarding_completed === true;
		const isOnboardingPage = pathname.includes("/onboarding");

		// If onboarding not completed and NOT on onboarding page, redirect
		if (!isOnboarded && !isOnboardingPage) {
			router.push("/onboarding");
		}

		// If already onboarded and ON onboarding page, redirect to dashboard
		if (isOnboarded && isOnboardingPage) {
			router.push("/dashboard");
		}
	}, [session, isPending, pathname, router]);

	return null;
}
