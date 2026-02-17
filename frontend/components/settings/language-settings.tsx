"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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

const LANGUAGES = [
	{ value: "en" as const, label: "English", region: "United States" },
	{ value: "pt-BR" as const, label: "Portugues (Brasil)", region: "Brazil" },
	{ value: "es" as const, label: "Espanol", region: "Spain" },
];

const TIMEZONES = [
	{ value: "America/Sao_Paulo", label: "Sao Paulo (GMT-3)" },
	{ value: "America/New_York", label: "New York (GMT-5)" },
	{ value: "America/Chicago", label: "Chicago (GMT-6)" },
	{ value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
	{ value: "Europe/London", label: "London (GMT+0)" },
	{ value: "Europe/Paris", label: "Paris (GMT+1)" },
	{ value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
	{ value: "Australia/Sydney", label: "Sydney (GMT+10)" },
];

function getLocale(lang: Language) {
	if (lang === "pt-BR") return "pt-BR";
	if (lang === "es") return "es-ES";
	return "en-US";
}

export function LanguageSettings() {
	const { toast } = useToast();
	const [saving, setSaving] = useState(false);
	const [settings, setSettings] = useState<LangState>({
		language: "en",
		dateFormat: "MM/DD/YYYY",
		timeFormat: "12h",
		numberFormat: "en-US",
		timezone: "America/New_York",
	});

	const update = <K extends keyof LangState>(key: K, value: LangState[K]) =>
		setSettings((prev) => ({ ...prev, [key]: value }));

	const handleSave = async () => {
		setSaving(true);
		await new Promise((r) => setTimeout(r, 800));
		setSaving(false);
		toast({ title: "Language settings saved" });
	};

	const locale = getLocale(settings.language);

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
				<div className="px-6 py-4 border-b border-border/40">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Language
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
									<p className="text-sm font-medium">{lang.label}</p>
									<p className="text-xs text-muted-foreground">{lang.region}</p>
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
						Regional formats
					</p>
				</div>
				<div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label className="text-xs">Date format</Label>
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
						<Label className="text-xs">Time format</Label>
						<Select
							value={settings.timeFormat}
							onValueChange={(v: TimeFormat) => update("timeFormat", v)}
						>
							<SelectTrigger className="h-9 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="12h">12-hour (3:45 PM)</SelectItem>
								<SelectItem value="24h">24-hour (15:45)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs">Number format</Label>
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
						<Label className="text-xs">Timezone</Label>
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
										{tz.label}
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
						Preview
					</p>
				</div>
				<div className="p-6">
					<div className="rounded-xl bg-muted/50 p-4 grid grid-cols-3 gap-4 text-center">
						<div>
							<p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
								Date
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
								Time
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
								Number
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
					{saving ? "Saving..." : "Save changes"}
				</Button>
			</div>
		</div>
	);
}
