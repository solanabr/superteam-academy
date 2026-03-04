"use client";

import { Check } from "lucide-react";
import { useRouter } from "@bprogress/next/app";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useSettingsSection } from "@/hooks/use-settings";

type Language = "en" | "pt-BR" | "es";
type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
type TimeFormat = "12h" | "24h";
type NumberFormat = "pt-BR" | "en-US" | "es-ES";

interface LangState {
	language: Language;
	dateFormat: DateFormat;
	timeFormat: TimeFormat;
	numberFormat: NumberFormat;
	timezone: string;
}

const LANGUAGES = [{ value: "en" as const }, { value: "pt-BR" as const }, { value: "es" as const }];

const TIMEZONES = [
	{ value: "America/Sao_Paulo", key: "saoPaulo" },
	{ value: "America/New_York", key: "newYork" },
	{ value: "America/Chicago", key: "chicago" },
	{ value: "America/Los_Angeles", key: "losAngeles" },
	{ value: "Europe/London", key: "london" },
	{ value: "Europe/Paris", key: "paris" },
	{ value: "Asia/Tokyo", key: "tokyo" },
	{ value: "Australia/Sydney", key: "sydney" },
];

function getLocale(lang: Language) {
	if (lang === "pt-BR") return "pt-BR";
	if (lang === "es") return "es-ES";
	return "en-US";
}

const LANG_DEFAULTS: LangState = {
	language: "en",
	dateFormat: "MM/DD/YYYY",
	timeFormat: "12h",
	numberFormat: "en-US",
	timezone: "America/New_York",
};

export function LanguageSettings() {
	const t = useTranslations("settings.languageSection");
	const router = useRouter();
	const {
		settings,
		saving,
		update,
		save: handleSave,
	} = useSettingsSection("language", LANG_DEFAULTS, {
		successTitle: t("toast.savedTitle"),
		errorTitle: t("toast.errorTitle"),
		errorDescription: t("toast.errorDescription"),
		onSuccess: () => router.refresh(),
	});

	const locale = getLocale(settings.language);

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
				<div className="px-6 py-4 border-b border-border/40">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						{t("sections.language")}
					</p>
				</div>
				<div className="p-4 grid gap-2">
					{LANGUAGES.map((lang) => {
						const active = settings.language === lang.value;
						return (
							<button
								key={lang.value}
								type="button"
								onClick={() => update("language", lang.value)}
								className={`flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${
									active
										? "bg-primary/10 border border-primary/30"
										: "hover:bg-muted/60 border border-transparent"
								}`}
							>
								<div>
									<p className="text-sm font-medium">
										{t(`languages.${lang.value}.label`)}
									</p>
									<p className="text-xs text-muted-foreground">
										{t(`languages.${lang.value}.region`)}
									</p>
								</div>
								{active && <Check className="h-4 w-4 text-primary" />}
							</button>
						);
					})}
				</div>
			</div>

			<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
				<div className="px-6 py-4 border-b border-border/40">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						{t("sections.regionalFormats")}
					</p>
				</div>
				<div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label className="text-xs">{t("labels.dateFormat")}</Label>
						<Select
							value={settings.dateFormat}
							onValueChange={(v: DateFormat) => update("dateFormat", v)}
						>
							<SelectTrigger className="h-9 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
								<SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
								<SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs">{t("labels.timeFormat")}</Label>
						<Select
							value={settings.timeFormat}
							onValueChange={(v: TimeFormat) => update("timeFormat", v)}
						>
							<SelectTrigger className="h-9 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="12h">{t("timeFormats.12h")}</SelectItem>
								<SelectItem value="24h">{t("timeFormats.24h")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs">{t("labels.numberFormat")}</Label>
						<Select
							value={settings.numberFormat}
							onValueChange={(v: NumberFormat) => update("numberFormat", v)}
						>
							<SelectTrigger className="h-9 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="en-US">1,234.56</SelectItem>
								<SelectItem value="pt-BR">1.234,56</SelectItem>
								<SelectItem value="es-ES">1.234,56</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs">{t("labels.timezone")}</Label>
						<Select
							value={settings.timezone}
							onValueChange={(v) => update("timezone", v)}
						>
							<SelectTrigger className="h-9 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TIMEZONES.map((tz) => (
									<SelectItem key={tz.value} value={tz.value}>
										{t(`timezones.${tz.key}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
				<div className="px-6 py-4 border-b border-border/40">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						{t("sections.preview")}
					</p>
				</div>
				<div className="p-6">
					<div className="rounded-xl bg-muted/50 p-4 grid grid-cols-3 gap-4 text-center">
						<div>
							<p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
								{t("preview.date")}
							</p>
							<p className="text-sm font-medium font-mono">
								{new Date().toLocaleDateString(locale, {
									timeZone: settings.timezone,
									day: "2-digit",
									month: "2-digit",
									year: "numeric",
								})}
							</p>
						</div>
						<div>
							<p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
								{t("preview.time")}
							</p>
							<p className="text-sm font-medium font-mono">
								{new Date().toLocaleTimeString(locale, {
									timeZone: settings.timezone,
									hour12: settings.timeFormat === "12h",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</div>
						<div>
							<p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
								{t("preview.number")}
							</p>
							<p className="text-sm font-medium font-mono">
								{new Intl.NumberFormat(settings.numberFormat, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								}).format(1234.56)}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="flex justify-end">
				<Button size="sm" onClick={handleSave} disabled={saving}>
					{saving ? t("actions.saving") : t("actions.saveChanges")}
				</Button>
			</div>
		</div>
	);
}
