/**
 * @fileoverview Signup redirection page.
 * Redirects legacy or direct /auth/signup access to the unified auth page.
 */
import { redirect } from "next/navigation";

/**
 * Redirects the user to the unified authentication page.
 */
export default function SignupPage() {
	redirect("/auth");
}
