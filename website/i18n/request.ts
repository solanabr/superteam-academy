import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * i18n REQUEST CONFIGURATION
 * 
 * This file handles the lazy-loading of translation messages for each request.
 * 
 * SCALING TIP:
 * - Organize messages into namespaces in your JSON files (e.g., "common", "dashboard").
 * - This keeps the files modular and easier to translate using tools like Crowdin or Loco.
 */

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale: locale as string,
    messages: (await import(`../src/messages/${locale}.json`)).default,
  };
});
