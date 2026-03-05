/**
 * @fileoverview Interface settings component for managing theme and language preferences.
 */
"use client";

import { SlidersHorizontalIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LanguageDropdown } from "@/components/LanguageDropdown";
import { useSettings } from "@/components/settings/SettingsContext";
import { updateUserProfile } from "@/lib/actions/updateProfile";
import { useSession } from "@/lib/auth/client";

function CheckBox({
	checked,
	onClick,
}: {
	checked: boolean;
	onClick: () => void;
}) {
	return (
		<div
			onClick={onClick}
			role="checkbox"
			aria-checked={checked}
			className={`w-4 h-4 border border-ink-primary cursor-pointer flex items-center justify-center transition-colors ${checked ? "bg-ink-primary" : ""}`}
		>
			{checked && <div className="w-2 h-2 bg-bg-base" />}
		</div>
	);
}

interface NotificationPrefs {
	newCourses: boolean;
	leaderboardAlerts: boolean;
	directMessages: boolean;
}

export function InterfaceSettings() {
	const t = useTranslations("Settings.interface");
	const { data: session, refetch } = useSession();
	const { theme, setTheme } = useTheme();
	const [isPending, startTransition] = useTransition();

	const userAny = session?.user as {
		language?: string;
		notifications?: NotificationPrefs;
	};
	const [notifications, setNotifications] = useState<NotificationPrefs>(
		userAny?.notifications ?? {
			newCourses: true,
			leaderboardAlerts: false,
			directMessages: true,
		},
	);
	const { addLog } = useSettings();

	const toggleNotification = (key: keyof NotificationPrefs) => {
		setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const handleSave = () => {
		startTransition(async () => {
			const result = await updateUserProfile({ notifications });
			if (result?.error) {
				toast.error(result.error);
			} else {
				toast.success(t("saved"));
				addLog("Notification preferences updated.");
				refetch();
			}
		});
	};

	return (
		<div className="border border-border bg-bg-surface p-6 flex flex-col gap-5">
			<div className="border-b border-border pb-2 mb-2 flex items-center gap-2 font-bold uppercase tracking-widest text-[11px]">
				<SlidersHorizontalIcon size={14} weight="duotone" /> {t("title")}
			</div>

			{/* System Language */}
			<div className="flex flex-col gap-1.5">
				<label className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">
					{t("languageLabel")}
				</label>
				<LanguageDropdown variant="detailed" className="w-full" />
			</div>

			{/* Terminal Theme */}
			<div className="flex items-center justify-between py-2">
				<div>
					<div className="font-bold uppercase tracking-widest text-[11px]">
						{t("themeLabel")}
					</div>
					<div className="text-[10px] text-ink-secondary tracking-widest">
						{t("themeDesc")}
					</div>
				</div>
				<button
					type="button"
					onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
					className="border border-ink-secondary/40 bg-transparent px-3 py-1 text-[10px] uppercase tracking-widest hover:bg-ink-primary hover:text-bg-base transition-colors"
				>
					{theme === "dark" ? t("themeDark") : t("themeLight")}
				</button>
			</div>

			{/* Notifications */}
			<div className="flex flex-col gap-1.5">
				<label className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">
					{t("notificationsLabel")}
				</label>

				<div className="flex items-center justify-between py-2">
					<span className="text-[10px] tracking-widest">{t("newCourses")}</span>
					<CheckBox
						checked={notifications.newCourses}
						onClick={() => toggleNotification("newCourses")}
					/>
				</div>

				<div className="flex items-center justify-between py-2">
					<span className="text-[10px] tracking-widest">
						{t("leaderboardAlerts")}
					</span>
					<CheckBox
						checked={notifications.leaderboardAlerts}
						onClick={() => toggleNotification("leaderboardAlerts")}
					/>
				</div>

				<div className="flex items-center justify-between py-2">
					<span className="text-[10px] tracking-widest">
						{t("directMessages")}
					</span>
					<CheckBox
						checked={notifications.directMessages}
						onClick={() => toggleNotification("directMessages")}
					/>
				</div>
			</div>

			<button
				type="button"
				onClick={handleSave}
				disabled={isPending}
				className="bg-ink-primary text-bg-base border border-ink-primary px-5 py-2.5 text-[12px] uppercase tracking-widest font-bold w-full hover:bg-ink-primary/90 transition-colors disabled:opacity-50"
			>
				{isPending ? t("saving") : t("save")}
			</button>
		</div>
	);
}
