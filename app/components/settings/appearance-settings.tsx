"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSettingsSave } from "@/hooks/use-settings";

type ThemeVal = "light" | "dark" | "system";

const THEMES = [
	{ value: "light" as const, Icon: Sun },
	{ value: "dark" as const, Icon: Moon },
	{ value: "system" as const, Icon: Monitor },
];

const FONT_SIZES = [{ value: "small" }, { value: "medium" }, { value: "large" }];

export function AppearanceSettings() {
	const t = useTranslations("settings.appearanceSection");
	const { theme, setTheme } = useTheme();
	const { data, saving: isLoading, handleSave: saveSettings } = useSettingsSave({
		successTitle: t("toast.updatedTitle"),
		successDescription: t("toast.updatedDescription"),
		errorTitle: t("toast.errorTitle"),
		errorDescription: t("toast.errorDescription"),
	});
	const [currentTheme, setCurrentTheme] = useState<ThemeVal>((theme as ThemeVal) || "system");
	const [fontSize, setFontSize] = useState("medium");
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		setCurrentTheme((theme as ThemeVal) || "system");
	}, [theme]);

	useEffect(() => {
		if (!data?.settings?.appearance) return;
		const a = data.settings.appearance;
		if (a.theme) setCurrentTheme(a.theme);
		if (a.fontSize) setFontSize(a.fontSize);
		if (typeof a.reducedMotion === "boolean") setReducedMotion(a.reducedMotion);
	}, [data]);

	const handleSave = () => {
		setTheme(currentTheme);
		saveSettings({
			settings: { appearance: { theme: currentTheme, fontSize, reducedMotion } },
		});
	};

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
			<div className="px-6 py-4 border-b border-border/40">
				<h3 className="font-semibold text-sm">{t("title")}</h3>
			</div>

			<div className="p-6 space-y-6">
				<div className="space-y-3">
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						{t("sections.theme")}
					</h4>
					<div className="grid grid-cols-3 gap-2">
						{THEMES.map(({ value, Icon }) => (
							<button
								key={value}
								type="button"
								onClick={() => setCurrentTheme(value)}
								className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
									currentTheme === value
										? "border-primary bg-primary/5"
										: "border-border/60 hover:bg-muted/30"
								}`}
							>
								<Icon
									className={`h-5 w-5 ${currentTheme === value ? "text-primary" : "text-muted-foreground"}`}
								/>
								<span className="text-xs font-medium">
									{t(`themeOptions.${value}`)}
								</span>
							</button>
						))}
					</div>
				</div>

				<div className="space-y-3">
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						{t("sections.fontSize")}
					</h4>
					<div className="flex gap-2">
						{FONT_SIZES.map(({ value }) => (
							<button
								key={value}
								type="button"
								onClick={() => setFontSize(value)}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									fontSize === value
										? "bg-primary text-primary-foreground"
										: "bg-muted/50 text-muted-foreground hover:bg-muted"
								}`}
							>
								{t(`fontSizeOptions.${value}`)}
							</button>
						))}
					</div>
				</div>

				<div className="space-y-3">
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						{t("sections.accessibility")}
					</h4>
					<div className="flex items-center justify-between py-2">
						<div>
							<Label className="text-sm">{t("reducedMotion.title")}</Label>
							<p className="text-xs text-muted-foreground">
								{t("reducedMotion.description")}
							</p>
						</div>
						<Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
					</div>
				</div>

				<div className="flex justify-end pt-2">
					<Button onClick={handleSave} disabled={isLoading} size="sm">
						{isLoading ? t("actions.saving") : t("actions.saveChanges")}
					</Button>
				</div>
			</div>
		</div>
	);
}
