/**
 * @fileoverview Privacy settings component for managing public visibility and data export.
 */
"use client";

import { EyeSlashIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useSettings } from "@/components/settings/SettingsContext";
import { updateUserProfile } from "@/lib/actions/updateProfile";
import { useSession } from "@/lib/auth/client";

export function PrivacySettings() {
	const t = useTranslations("Settings.privacy");
	const { data: session, refetch } = useSession();
	const userAny = session?.user as {
		publicVisibility?: boolean;
		walletAddress?: string;
	};
	const [isPending, startTransition] = useTransition();

	const [publicVisibility, setPublicVisibility] = useState(
		userAny?.publicVisibility ?? true,
	);
	const { addLog } = useSettings();

	const handleSave = () => {
		startTransition(async () => {
			const result = await updateUserProfile({ publicVisibility });
			if (result?.error) {
				toast.error(result.error);
			} else {
				toast.success(t("saved"));
				addLog("Privacy preferences updated successfully.");
				refetch();
			}
		});
	};

	const handleExportData = async () => {
		if (!session?.user) return;

		toast.promise(
			(async () => {
				const { getEnrolledCoursesProgress } = await import(
					"@/lib/actions/gamification"
				);
				const { syncUserXpAction: syncUserXp } = await import(
					"@/lib/actions/leaderboard"
				);

				const [courses, xpBalance] = await Promise.all([
					getEnrolledCoursesProgress(session.user.id),
					syncUserXp(
						session.user.id,
						userAny.walletAddress || session.user.id,
					) as Promise<number | undefined>,
				]);

				const data = {
					user: {
						...session.user,
						walletAddress: userAny.walletAddress,
					},
					achievements: [], // Would need action to fetch these too
					courses: courses,
					reputation: typeof xpBalance === "number" ? xpBalance : 0,
					exportedAt: new Date().toISOString(),
					platform: "Superteam Academy",
					note: "This is your personal machine-readable data export.",
				};

				const blob = new Blob([JSON.stringify(data, null, 2)], {
					type: "application/json",
				});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `academy-data-${session.user.id?.slice(0, 8)}.json`;
				a.click();
				URL.revokeObjectURL(url);
			})(),
			{
				loading: "Compiling record...",
				success: t("exported"),
				error: "Export failed",
			},
		);
	};

	return (
		<div className="border border-border bg-bg-surface p-6 flex flex-col gap-5">
			<div className="border-b border-border pb-2 mb-2 flex items-center gap-2 font-bold uppercase tracking-widest text-[11px]">
				<EyeSlashIcon size={14} weight="duotone" /> {t("title")}
			</div>

			{/* Public Visibility */}
			<div className="flex items-center justify-between py-2">
				<div>
					<div className="font-bold uppercase tracking-widest text-[11px]">
						{t("visibilityLabel")}
					</div>
					<div className="text-[10px] text-ink-secondary tracking-widest">
						{t("visibilityDesc")}
					</div>
				</div>
				<div
					role="checkbox"
					aria-checked={publicVisibility}
					onClick={() => setPublicVisibility((v) => !v)}
					className={`w-4 h-4 border border-ink-primary cursor-pointer flex items-center justify-center transition-colors ${publicVisibility ? "bg-ink-primary" : ""}`}
				>
					{publicVisibility && <div className="w-2 h-2 bg-bg-base" />}
				</div>
			</div>

			{/* Data Archive */}
			<div className="flex flex-col gap-1.5 mt-3">
				<label className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">
					{t("dataArchiveLabel")}
				</label>
				<button
					type="button"
					onClick={handleExportData}
					className="border border-ink-secondary/40 bg-transparent px-3 py-2.5 text-[11px] uppercase tracking-widest text-left hover:bg-ink-primary hover:text-bg-base hover:border-ink-primary transition-colors"
				>
					{t("exportBtn")}
				</button>
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
