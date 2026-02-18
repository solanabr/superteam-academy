import { Suspense } from "react";
import type { Metadata } from "next";
import { User, Bell, Shield, Palette, Globe, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ProfileSettings } from "@/components/settings/profile-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { PrivacySettings } from "@/components/settings/privacy-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { LanguageSettings } from "@/components/settings/language-settings";
import { WalletSettings } from "@/components/settings/wallet-settings";

export const metadata: Metadata = {
	title: "Settings | Superteam Academy",
	description: "Manage your account settings and preferences",
};

const TABS = [
	{ value: "profile", Icon: User },
	{ value: "notifications", Icon: Bell },
	{ value: "privacy", Icon: Shield },
	{ value: "appearance", Icon: Palette },
	{ value: "language", Icon: Globe },
	{ value: "wallet", Icon: Wallet },
] as const;

export default async function SettingsPage() {
	const t = await getTranslations("settings");

	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<SettingsSkeleton />}>
				<div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
						<p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
					</div>

					<Tabs defaultValue="profile" className="space-y-6">
						<TabsList className="h-auto p-1 bg-muted/50 rounded-xl flex flex-wrap gap-0.5">
							{TABS.map(({ value, Icon }) => (
								<TabsTrigger
									key={value}
									value={value}
									className="gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-3 py-2 text-xs sm:text-sm"
								>
									<Icon className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">{t(`tabs.${value}`)}</span>
								</TabsTrigger>
							))}
						</TabsList>

						<TabsContent value="profile">
							<ProfileSettings />
						</TabsContent>
						<TabsContent value="notifications">
							<NotificationSettings />
						</TabsContent>
						<TabsContent value="privacy">
							<PrivacySettings />
						</TabsContent>
						<TabsContent value="appearance">
							<AppearanceSettings />
						</TabsContent>
						<TabsContent value="language">
							<LanguageSettings />
						</TabsContent>
						<TabsContent value="wallet">
							<WalletSettings />
						</TabsContent>
					</Tabs>
				</div>
			</Suspense>
		</div>
	);
}

function SettingsSkeleton() {
	return (
		<div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
			<div className="space-y-2">
				<div className="h-8 w-32 bg-muted animate-pulse rounded-lg" />
				<div className="h-4 w-64 bg-muted animate-pulse rounded-lg" />
			</div>
			<div className="h-10 bg-muted animate-pulse rounded-xl" />
			<div className="space-y-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="h-16 bg-muted animate-pulse rounded-2xl" />
				))}
			</div>
		</div>
	);
}
