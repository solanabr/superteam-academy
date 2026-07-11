import { locales } from "@/lib/i18n/config";

// Pure, framework-free route classifiers for the admin guard in middleware.
// Both derive locale matching from the `locales` constant so mixed-case locales
// (e.g. `pt-BR`) are handled correctly — a locale-agnostic `[a-z-]+` regex would
// miss the uppercase segment and misclassify `/pt-BR/admin` as a sub-route,
// causing an infinite redirect loop back to itself (#418).

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

/** True only for the admin login root, e.g. `/en/admin` or `/pt-BR/admin/` (trailing slash allowed). */
export function isAdminRootPath(pathname: string): boolean {
  for (const locale of locales) {
    const prefix = `/${locale}`;
    if (pathname.startsWith(prefix)) {
      const rest = pathname.slice(prefix.length);
      return rest === "/admin" || rest === "/admin/";
    }
  }
  return false;
}
