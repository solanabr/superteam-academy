import { locales } from "@/lib/i18n/config";

// Pure, framework-free route classifier for the admin guard in middleware.
// Locale matching derives from the `locales` constant so mixed-case locales
// (e.g. `pt-BR`) are handled correctly — a locale-agnostic `[a-z-]+` regex would
// miss the uppercase segment and misclassify `/pt-BR/admin` (#418).

/** True for the admin section root or any admin sub-route, e.g. `/en/admin`, `/pt-BR/admin/content`. */
export function isAdminRoute(pathname: string): boolean {
  for (const locale of locales) {
    const prefix = `/${locale}`;
    if (pathname.startsWith(prefix)) {
      const rest = pathname.slice(prefix.length);
      return rest === "/admin" || rest.startsWith("/admin/");
    }
  }
  return false;
}
