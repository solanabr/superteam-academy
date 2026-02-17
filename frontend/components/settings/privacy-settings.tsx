"use client";

import { useState } from "react";
import { Eye, Users, Lock } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface PrivacyState {
	profileVisibility: "public" | "friends" | "private";
	showProgress: boolean;
	showAchievements: boolean;
	showActivity: boolean;
	allowMessaging: boolean;
	dataSharing: boolean;
	analyticsTracking: boolean;
}

const TOGGLE_ITEMS = [
	{ key: "showProgress" as const, label: "Show progress", desc: "Display course progress on your profile" },
	{ key: "showAchievements" as const, label: "Show achievements", desc: "Display badges and credentials" },
	{ key: "showActivity" as const, label: "Show activity", desc: "Display recent learning activity" },
	{ key: "allowMessaging" as const, label: "Allow messaging", desc: "Let other learners message you" },
	{ key: "dataSharing" as const, label: "Data sharing", desc: "Share anonymized data for platform improvement" },
	{ key: "analyticsTracking" as const, label: "Analytics tracking", desc: "Allow usage analytics to improve your experience" },
] as const;

const VISIBILITY_OPTIONS = [
	{ value: "public" as const, label: "Public", desc: "Anyone can view your profile", Icon: Eye },
	{ value: "friends" as const, label: "Friends only", desc: "Only connections can view", Icon: Users },
	{ value: "private" as const, label: "Private", desc: "Only you can view your profile", Icon: Lock },
];

export function PrivacySettings() {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [settings, setSettings] = useState<PrivacyState>({
		profileVisibility: "public",
		showProgress: true,
		showAchievements: true,
		showActivity: false,
		allowMessaging: true,
		dataSharing: false,
		analyticsTracking: true,
	});

	const handleSave = async () => {
		setIsLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toast({ title: "Privacy updated", description: "Your preferences have been saved." });
		} catch {
			toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
		} finally {
			setIsLoading(false);
		}
	};

	const update = <K extends keyof PrivacyState>(key: K, value: PrivacyState[K]) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
	};

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
			<div className="px-6 py-4 border-b border-border/40">
				<h3 className="font-semibold text-sm">Privacy & Visibility</h3>
			</div>

			<div className="p-6 space-y-6">
				<div className="space-y-2">
					<Label className="text-xs">Profile visibility</Label>
					<Select
						value={settings.profileVisibility}
						onValueChange={(v: "public" | "friends" | "private") => update("profileVisibility", v)}
					>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							{VISIBILITY_OPTIONS.map(({ value, label, desc, Icon }) => (
								<SelectItem key={value} value={value}>
									<div className="flex items-center gap-2">
										<Icon className="h-3.5 w-3.5" />
										<span>{label}</span>
										<span className="text-muted-foreground text-xs">- {desc}</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1">
					{TOGGLE_ITEMS.map(({ key, label, desc }) => (
						<div key={key} className="flex items-center justify-between py-2.5">
							<div>
								<Label className="text-sm">{label}</Label>
								<p className="text-xs text-muted-foreground">{desc}</p>
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
						{isLoading ? "Saving..." : "Save changes"}
					</Button>
				</div>
			</div>
		</div>
	);
}
