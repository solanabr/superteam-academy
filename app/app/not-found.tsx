import { NextIntlClientProvider } from "next-intl";
import { default as NotFound } from "./[locale]/not-found";
import { getLocale } from "next-intl/server";

export default async function NotFoundPage() {
	const locale = await getLocale();
	return (
		<NextIntlClientProvider locale={locale}>
			<NotFound />
		</NextIntlClientProvider>
	);
}
