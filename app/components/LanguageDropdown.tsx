/**
 * @fileoverview Language selection dropdown component.
 * Allows users to switch between supported locales (EN, ES, PT-BR, etc.).
 */
"use client";

import { useLocale, useTranslations } from "next-intl";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const languages = [
	{ code: "en", label: "EN", full: "English (EN)" },
	{ code: "de", label: "DE", full: "Deutsch (DE)" },
	{ code: "es", label: "ES", full: "Español (ES)" },
	{ code: "fr", label: "FR", full: "Français (FR)" },
	{ code: "hi", label: "HI", full: "हिंदी (HI)" },
	{ code: "id", label: "ID", full: "Indonesia (ID)" },
	{ code: "it", label: "IT", full: "Italiano (IT)" },
	{ code: "ja", label: "JA", full: "日本語 (JA)" },
	{ code: "ko", label: "KO", full: "한국어 (KO)" },
	{ code: "ne", label: "NE", full: "नेपाली (NE)" },
	{ code: "pt-br", label: "PT-BR", full: "Português (PT-BR)" },
	{ code: "ru", label: "RU", full: "Русский (RU)" },
	{ code: "tr", label: "TR", full: "Türkçe (TR)" },
	{ code: "vi", label: "VI", full: "Tiếng Việt (VI)" },
	{ code: "zh", label: "ZH", full: "中文 (ZH)" },
];

type SupportedLocale =
	| "en"
	| "de"
	| "es"
	| "fr"
	| "hi"
	| "id"
	| "it"
	| "ja"
	| "ko"
	| "ne"
	| "pt-br"
	| "ru"
	| "tr"
	| "vi"
	| "zh";

interface LanguageDropdownProps {
	variant?: "simple" | "detailed";
	className?: string;
}

export function LanguageDropdown({
	variant = "simple",
	className,
}: LanguageDropdownProps) {
	const locale = useLocale();
	const t = useTranslations("Footer");
	const router = useRouter();
	const pathname = usePathname();

	const handleLanguageChange = async (newLocale: string) => {
		// Persist to DB if authenticated
		try {
			const { updateUserProfile } = await import("@/lib/actions/updateProfile");
			await updateUserProfile({ language: newLocale });
		} catch (e) {
			console.error("Failed to persist language preference:", e);
		}

		router.replace(pathname, { locale: newLocale as SupportedLocale });
	};

	if (variant === "detailed") {
		return (
			<Select value={locale} onValueChange={handleLanguageChange}>
				<SelectTrigger
					className={cn(
						"w-auto border border-ink-secondary/20 dark:border-border px-3 py-1.5 h-auto bg-bg-base text-ink-secondary hover:text-ink-primary font-mono text-[11px] uppercase ring-offset-0 focus:ring-0 flex justify-start items-center gap-2 shadow-sm rounded-none data-placeholder:text-ink-secondary cursor-pointer relative z-50",
						className,
					)}
				>
					<span className="font-bold text-ink-primary whitespace-nowrap">
						{t("language")}
					</span>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{languages.map((lang) => (
						<SelectItem
							key={lang.code}
							value={lang.code}
							className="text-[11px] uppercase"
						>
							{lang.full}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		);
	}

	return (
		<Select value={locale} onValueChange={handleLanguageChange}>
			<SelectTrigger
				className={cn(
					"w-[80px] h-auto py-1 px-2 text-[11px] uppercase border-ink-secondary bg-transparent",
					className,
				)}
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{languages.map((lang) => (
					<SelectItem
						key={lang.code}
						value={lang.code}
						className="text-[11px] uppercase"
					>
						{lang.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
