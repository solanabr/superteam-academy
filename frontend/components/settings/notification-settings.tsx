"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";

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

const TOGGLE_ITEMS = [
	{ key: "emailNotifications" as const, label: "Email notifications", desc: "Receive updates via email", Icon: Mail, section: "general" },
	{ key: "pushNotifications" as const, label: "Push notifications", desc: "Browser & mobile push alerts", Icon: MessageSquare, section: "general" },
	{ key: "courseUpdates" as const, label: "Course updates", desc: "New content & curriculum changes", Icon: BookOpen, section: "types" },
	{ key: "achievementAlerts" as const, label: "Achievement alerts", desc: "Badges and milestone notifications", Icon: Trophy, section: "types" },
	{ key: "weeklyDigest" as const, label: "Weekly digest", desc: "Summary of your weekly activity", section: "types" },
	{ key: "marketingEmails" as const, label: "Marketing emails", desc: "Product news and promotions", section: "types" },
] as const;

export function NotificationSettings() {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [settings, setSettings] = useState<NotificationState>({
		emailNotifications: true,
		pushNotifications: true,
		courseUpdates: true,
		achievementAlerts: true,
		weeklyDigest: true,
		marketingEmails: false,
		emailFrequency: "daily",
		pushFrequency: "immediate",
	});

	const handleSave = async () => {
		setIsLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toast({ title: "Notifications updated", description: "Your preferences have been saved." });
		} catch {
			toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
		} finally {
			setIsLoading(false);
		}
	};

	const update = <K extends keyof NotificationState>(key: K, value: NotificationState[K]) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
	};

	const renderSection = (title: string, section: string) => (
		<div className="space-y-3">
			<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h4>
			{TOGGLE_ITEMS.filter((i) => i.section === section).map(({ key, label, desc, Icon }) => (
				<div key={key} className="flex items-center justify-between py-2">
					<div className="flex items-center gap-3">
						{Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
						<div>
							<Label className="text-sm">{label}</Label>
							<p className="text-xs text-muted-foreground">{desc}</p>
						</div>
					</div>
					<Switch
						checked={settings[key] as boolean}
						onCheckedChange={(checked) => update(key, checked)}
					/>
				</div>
			))}
		</div>
	);

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
			<div className="px-6 py-4 border-b border-border/40">
				<h3 className="font-semibold text-sm">Notifications</h3>
			</div>

			<div className="p-6 space-y-6">
				{renderSection("General", "general")}
				{renderSection("Notification Types", "types")}

				<div className="space-y-3">
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Frequency</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs">Email frequency</Label>
							<Select value={settings.emailFrequency} onValueChange={(v: "immediate" | "daily" | "weekly") => update("emailFrequency", v)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="immediate">Immediate</SelectItem>
									<SelectItem value="daily">Daily digest</SelectItem>
									<SelectItem value="weekly">Weekly digest</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">Push frequency</Label>
							<Select value={settings.pushFrequency} onValueChange={(v: "immediate" | "daily" | "weekly") => update("pushFrequency", v)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="immediate">Immediate</SelectItem>
									<SelectItem value="daily">Daily digest</SelectItem>
									<SelectItem value="weekly">Weekly digest</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
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
