import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

/**
 * INTERNATIONALIZATION (i18n) CONFIGURATION & SCALING GUIDE
 * 
 * To scale this implementation in the future:
 * 
 * 1. ADDING A NEW LANGUAGE:
 *    - Add the new locale code (e.g., 'fr', 'de') to the `locales` array below.
 *    - Create a corresponding JSON file in `src/messages/[locale].json` (e.g., `fr.json`).
 *    - Ensure all keys from `en.json` are present in the new file to avoid fallback warnings.
 * 
 * 2. UPDATING NAVIGATION:
 *    - Use the exported `Link`, `useRouter`, and `usePathname` from this file instead of 'next/link' or 'next/navigation'.
 *    - These wrappers automatically handle the `/[locale]/` prefix in the URL.
 * 
 * 3. ROUTING & MIDDLEWARE:
 *    - Specific paths like `api` or `studio` are excluded in `src/middleware.ts`. 
 *    - Update the middleware matcher if you add new top-level non-localized routes.
 */

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ["en", "es", "pt-BR"],

    // Used when no locale matches
    defaultLocale: "en",
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
