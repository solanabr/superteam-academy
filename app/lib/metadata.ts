import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function getLocalizedPageMetadata(locale: string, pageKey: string): Promise<Metadata> {
	const t = await getTranslations({
		locale,
		namespace: `seo.pages.${pageKey}`,
	});

	return {
		title: t("title"),
		description: t("description"),
	};
}
