"use client";

import { useTranslations } from "next-intl";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { InterfaceSettings } from "@/components/settings/InterfaceSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import {
	SettingsProvider,
	useSettings,
} from "@/components/settings/SettingsContext";
import { SyncStatus } from "@/components/settings/SyncStatus";
import { SystemLog } from "@/components/settings/SystemLog";
import { SystemNotices } from "@/components/settings/SystemNotices";
import { DotGrid } from "@/components/shared/DotGrid";
import { useSession } from "@/lib/auth/client";
import { mockSystemNotices } from "@/lib/data/settings";

export function SettingsView() {
	return (
		<SettingsProvider>
			<SettingsContent />
		</SettingsProvider>
	);
}

function SettingsContent() {
	const { data: session } = useSession();
	const t = useTranslations("Settings.view");
	const { logs, syncStatus } = useSettings();
	const notices = mockSystemNotices;

	return (
		<div className="min-h-screen bg-bg-base">
			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr_350px] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full">
				<div className="col-span-1 lg:col-span-3">
					<TopBar />
				</div>

				<NavRail />

				<section className="p-4 lg:p-8 overflow-visible lg:overflow-y-auto flex flex-col gap-12 relative">
					<DotGrid opacity={0.15} />
					<div className="border-b border-border pb-2">
						<span className="bg-ink-primary text-bg-base px-2 py-1 text-[10px] uppercase tracking-widest inline-block mb-2">
							{t("badge")}
						</span>
						<div className="flex justify-between items-end">
							<h2 className="font-display text-2xl lg:text-[32px] leading-none -tracking-wider">
								{t("title")}
							</h2>
							<div className="text-[10px] uppercase tracking-widest text-ink-secondary hidden sm:block">
								{session?.user?.email ?? "—"}
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
						<ProfileSettings />
						<AccountSettings />
						<InterfaceSettings />
						<PrivacySettings />
					</div>
				</section>

				<aside className="relative border-t lg:border-t-0 lg:border-l border-border bg-bg-base overflow-hidden flex flex-col">
					<div className="relative z-10 p-6 flex flex-col gap-8 flex-1 overflow-visible lg:overflow-y-auto">
						<SyncStatus status={syncStatus} />
						<SystemNotices notices={notices} />
						<SystemLog entries={logs} />
					</div>
				</aside>
			</div>
		</div>
	);
}
