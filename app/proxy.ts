import createMiddleware from "next-intl/middleware";
import { routing } from "@superteam-academy/i18n/routing";

export default createMiddleware(routing);

export const config = {
	matcher: [
		// - … if they start with `/api`, `/_next` or `/_vercel`
		// - … the ones containing a dot (e.g. `favicon.ico`)
		"/((?!api|_next|_vercel|.*\\.).*)",
	],
};
