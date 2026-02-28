"use client";

import { useState, useEffect } from "react";
import { Mail, MessageSquare, Trophy, BookOpen } from "lucide-react";
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

interface NotificationState {
	emailNotifications: boolean;
	pushNotifications: boolean;
	courseUpdates: boolean;
	achievementAlerts: boolean;
	weeklyDigest: boolean;
	marketingEmails: boolean;
	emailFrequency: "immediate" | "daily" | "weekly";
	pushFrequency: "immediate" | "daily" | "weekly";
}

const DEFAULTS: NotificationState = {
	emailNotifications: true,
	pushNotifications: true,
	courseUpdates: true,
	achievementAlerts: true,
	weeklyDigest: true,
	marketingEmails: false,
	emailFrequency: "daily",
	pushFrequency: "immediate",
};

const TOGGLE_ITEMS = [
	{
		key: "emailNotifications" as const,
		labelKey: "toggles.emailNotifications.label",
		descKey: "toggles.emailNotifications.description",
		Icon: Mail,
		section: "general",
	},
	{
		key: "pushNotifications" as const,
		labelKey: "toggles.pushNotifications.label",
		descKey: "toggles.pushNotifications.description",
		Icon: MessageSquare,
		section: "general",
	},
	{
		key: "courseUpdates" as const,
		labelKey: "toggles.courseUpdates.label",
		descKey: "toggles.courseUpdates.description",
		Icon: BookOpen,
		section: "types",
	},
	{
		key: "achievementAlerts" as const,
		labelKey: "toggles.achievementAlerts.label",
		descKey: "toggles.achievementAlerts.description",
		Icon: Trophy,
		section: "types",
	},
	{
		key: "weeklyDigest" as const,
		labelKey: "toggles.weeklyDigest.label",
		descKey: "toggles.weeklyDigest.description",
		section: "types",
	},
	{
		key: "marketingEmails" as const,
		labelKey: "toggles.marketingEmails.label",
		descKey: "toggles.marketingEmails.description",
		section: "types",
	},
] as const;

export function NotificationSettings() {
	const t = useTranslations("settings.notificationsSection");
	const { toast } = useToast();
	const { data, save } = useSettings();
	const [isLoading, setIsLoading] = useState(false);
	const [settings, setSettings] = useState<NotificationState>(DEFAULTS);

	useEffect(() => {
		if (!data?.settings?.notifications) return;
		setSettings((prev) => ({ ...prev, ...data.settings.notifications }));
	}, [data]);

	const handleSave = async () => {
		setIsLoading(true);
		try {
			await save({ settings: { notifications: settings } });
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

	const update = <K extends keyof NotificationState>(key: K, value: NotificationState[K]) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
	};

	const renderSection = (title: string, section: string) => (
		<div className="space-y-3">
			<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
				{title}
			</h4>
			{TOGGLE_ITEMS.filter((i) => i.section === section).map((item) => {
				const { key, labelKey, descKey } = item;
				const Icon = "Icon" in item ? item.Icon : null;
				return (
					<div key={key} className="flex items-center justify-between py-2">
						<div className="flex items-center gap-3">
							{Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
							<div>
								<Label className="text-sm">{t(labelKey)}</Label>
								<p className="text-xs text-muted-foreground">{t(descKey)}</p>
							</div>
						</div>
						<Switch
							checked={settings[key] as boolean}
							onCheckedChange={(checked) => update(key, checked)}
						/>
					</div>
				);
			})}
		</div>
	);

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
			<div className="px-6 py-4 border-b border-border/40">
				<h3 className="font-semibold text-sm">{t("title")}</h3>
			</div>

			<div className="p-6 space-y-6">
				{renderSection(t("sections.general"), "general")}
				{renderSection(t("sections.notificationTypes"), "types")}

				<div className="space-y-3">
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						{t("sections.frequency")}
					</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs">{t("labels.emailFrequency")}</Label>
							<Select
								value={settings.emailFrequency}
								onValueChange={(v: "immediate" | "daily" | "weekly") =>
									update("emailFrequency", v)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="immediate">
										{t("frequency.immediate")}
									</SelectItem>
									<SelectItem value="daily">{t("frequency.daily")}</SelectItem>
									<SelectItem value="weekly">{t("frequency.weekly")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">{t("labels.pushFrequency")}</Label>
							<Select
								value={settings.pushFrequency}
								onValueChange={(v: "immediate" | "daily" | "weekly") =>
									update("pushFrequency", v)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="immediate">
										{t("frequency.immediate")}
									</SelectItem>
									<SelectItem value="daily">{t("frequency.daily")}</SelectItem>
									<SelectItem value="weekly">{t("frequency.weekly")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
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
