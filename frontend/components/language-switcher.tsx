"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { locales } from "@superteam-academy/i18n/config";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
	const t = useTranslations("settings");
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const [_isPending, startTransition] = useTransition();

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
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="p-2 md:p-1 rounded-lg hover:bg-muted transition-colors"
					aria-label={t("switchLanguage")}
				>
					<Globe className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-35">
				{locales.map((l) => (
					<DropdownMenuItem
						key={l.code}
						onClick={() => switchLocale(l.code)}
						className={cn("cursor-pointer", locale === l.code && "bg-accent")}
					>
						<span className="mr-2">{l.flag}</span>
						{l.name}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
