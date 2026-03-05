/**
 * @fileoverview Internationalization middleware configuration.
 * Handles locale detection and redirection for Superteam Academy.
 */
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
	// Match only internationalized pathnames
	matcher: ["/", "/(en|de|es|fr|hi|id|it|ja|ko|ne|pt-br|ru|tr|vi|zh)/:path*"],
};
