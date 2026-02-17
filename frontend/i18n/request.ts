import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
	const locale = (await requestLocale) || "en";
	return {
		locale,
		messages: (await import(`../../packages/i18n/locales/${locale}.json`)).default,
	};
});
