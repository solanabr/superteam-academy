"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, Users, Lock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";

interface PrivacyState {
	profileVisibility: "public" | "friends" | "private";
	showProgress: boolean;
	showAchievements: boolean;
	showActivity: boolean;
	allowMessaging: boolean;
	dataSharing: boolean;
	analyticsTracking: boolean;
}

const DEFAULTS: PrivacyState = {
	profileVisibility: "public",
	showProgress: true,
	showAchievements: true,
	showActivity: false,
	allowMessaging: true,
	dataSharing: false,
	analyticsTracking: true,
};

const TOGGLE_ITEMS = [
	{
		key: "showProgress" as const,
		labelKey: "toggles.showProgress.label",
		descKey: "toggles.showProgress.description",
	},
	{
		key: "showAchievements" as const,
		labelKey: "toggles.showAchievements.label",
		descKey: "toggles.showAchievements.description",
	},
	{
		key: "showActivity" as const,
		labelKey: "toggles.showActivity.label",
		descKey: "toggles.showActivity.description",
	},
	{
		key: "allowMessaging" as const,
		labelKey: "toggles.allowMessaging.label",
		descKey: "toggles.allowMessaging.description",
	},
	{
		key: "dataSharing" as const,
		labelKey: "toggles.dataSharing.label",
		descKey: "toggles.dataSharing.description",
	},
	{
		key: "analyticsTracking" as const,
		labelKey: "toggles.analyticsTracking.label",
		descKey: "toggles.analyticsTracking.description",
	},
] as const;

const VISIBILITY_OPTIONS = [
	{
		value: "public" as const,
		labelKey: "visibility.public.label",
		descKey: "visibility.public.description",
		Icon: Eye,
	},
	{
		value: "friends" as const,
		labelKey: "visibility.friends.label",
		descKey: "visibility.friends.description",
		Icon: Users,
	},
	{
		value: "private" as const,
		labelKey: "visibility.private.label",
		descKey: "visibility.private.description",
		Icon: Lock,
	},
];

export function PrivacySettings() {
	const t = useTranslations("settings.privacySection");
	const { toast } = useToast();
	const { data, save } = useSettings();
	const [isLoading, setIsLoading] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [settings, setSettings] = useState<PrivacyState>(DEFAULTS);

	useEffect(() => {
		if (!data?.settings?.privacy) return;
		setSettings((prev) => ({ ...prev, ...data.settings.privacy }));
	}, [data]);

	const handleSave = async () => {
		setIsLoading(true);
		try {
			await save({ settings: { privacy: settings } });
			toast({
				title: t("toast.updatedTitle"),
				description: t("toast.updatedDescription"),
			});
		} catch {
			toast({
				title: t("toast.errorTitle"),
				description: t("toast.errorDescription"),
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const update = <K extends keyof PrivacyState>(key: K, value: PrivacyState[K]) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
	};

	const handleExport = useCallback(async () => {
		setIsExporting(true);
		try {
			const exportData = {
				exportedAt: new Date().toISOString(),
				privacySettings: settings,
				note: t("export.note"),
			};
			const blob = new Blob([JSON.stringify(exportData, null, 2)], {
				type: "application/json",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `superteam-academy-data-export-${new Date().toISOString().split("T")[0]}.json`;
			link.click();
			URL.revokeObjectURL(url);
			toast({
				title: t("toast.exportedTitle"),
				description: t("toast.exportedDescription"),
			});
		} catch {
			toast({
				title: t("toast.exportFailedTitle"),
				description: t("toast.exportFailedDescription"),
				variant: "destructive",
			});
		} finally {
			setIsExporting(false);
		}
	}, [settings, t, toast]);

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
			<div className="px-6 py-4 border-b border-border/40">
				<h3 className="font-semibold text-sm">{t("title")}</h3>
			</div>

			<div className="p-6 space-y-6">
				<div className="space-y-2">
					<Label className="text-xs">{t("labels.profileVisibility")}</Label>
					<Select
						value={settings.profileVisibility}
						onValueChange={(v: "public" | "friends" | "private") =>
							update("profileVisibility", v)
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{VISIBILITY_OPTIONS.map(({ value, labelKey, descKey, Icon }) => (
								<SelectItem key={value} value={value}>
									<div className="flex items-center gap-2">
										<Icon className="h-3.5 w-3.5" />
										<span>{t(labelKey)}</span>
										<span className="text-muted-foreground text-xs">
											- {t(descKey)}
										</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1">
					{TOGGLE_ITEMS.map(({ key, labelKey, descKey }) => (
						<div key={key} className="flex items-center justify-between py-2.5">
							<div>
								<Label className="text-sm">{t(labelKey)}</Label>
								<p className="text-xs text-muted-foreground">{t(descKey)}</p>
							</div>
							<Switch
								checked={settings[key]}
								onCheckedChange={(checked) => update(key, checked)}
							/>
						</div>
					))}
				</div>

				<div className="flex justify-end pt-2">
					<Button onClick={handleSave} disabled={isLoading} size="sm">
						{isLoading ? t("actions.saving") : t("actions.saveChanges")}
					</Button>
				</div>

				<div className="pt-4 border-t border-border/40 space-y-2">
					<Label className="text-xs">{t("export.title")}</Label>
					<p className="text-xs text-muted-foreground">{t("export.description")}</p>
					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						disabled={isExporting}
						className="gap-1.5"
					>
						<Download className="h-3.5 w-3.5" />
						{isExporting ? t("actions.exporting") : t("actions.exportData")}
					</Button>
				</div>
			</div>
		</div>
	);
}
