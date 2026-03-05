/**
 * @fileoverview Login redirection page.
 * Redirects legacy or direct /auth/login access to the unified auth page.
 */

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

/**
 * Redirects the user to the localized unified authentication page.
 */
export default async function LoginPage() {
	const locale = await getLocale();
	redirect(`/${locale}/auth`);
}
