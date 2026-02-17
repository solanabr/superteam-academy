"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { locales } from "@superteam-academy/i18n/config";

export function LanguageSwitcher() {
	const t = useTranslations("settings");
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();

	const switchLocale = (newLocale: string) => {
		startTransition(() => {
			// Remove the current locale from the pathname
			const segments = pathname.split("/");
			segments.splice(1, 1); // Remove locale segment

			// Add the new locale
			const newPathname = `/${newLocale}${segments.join("/")}`;

			router.replace(newPathname);
		});
	};

	return (
		<div className="flex items-center space-x-2">
			<span className="text-sm text-muted-foreground">{t("language")}:</span>
			<div className="flex space-x-1">
				{locales.map((localeInfo) => (
					<Button
						key={localeInfo.code}
						variant={locale === localeInfo.code ? "default" : "outline"}
						size="sm"
						onClick={() => switchLocale(localeInfo.code)}
						disabled={isPending}
						className="min-w-[60px]"
					>
						<span className="mr-1">{localeInfo.flag}</span>
						{localeInfo.code.toUpperCase()}
					</Button>
				))}
			</div>
		</div>
	);
}
