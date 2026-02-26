"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Loader2, Save, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

interface PlatformSettings {
	platformName: string;
	maintenanceMode: boolean;
	enrollmentOpen: boolean;
	maxCoursesPerUser: number;
	defaultXpPerLesson: number;
}

const DEFAULT_SETTINGS: PlatformSettings = {
	platformName: "Superteam Academy",
	maintenanceMode: false,
	enrollmentOpen: true,
	maxCoursesPerUser: 10,
	defaultXpPerLesson: 50,
};

export default function AdminSettingsPage() {
	const { isSuperAdmin } = useAuth();
	const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const fetchSettings = useCallback(async () => {
		try {
			const res = await fetch("/api/admin/settings");
			if (res.ok) {
				const data = (await res.json()) as { settings: PlatformSettings };
				setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	const handleSave = async () => {
		setSaving(true);
		setSaved(false);
		const res = await fetch("/api/admin/settings", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(settings),
		});
		if (res.ok) {
			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
		}
		setSaving(false);
	};

	if (!isSuperAdmin) {
		return (
			<div className="p-6">
				<Card>
					<CardContent className="py-16 text-center">
						<Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium mb-2">Super Admin Only</h3>
						<p className="text-muted-foreground">
							Only super administrators can manage platform settings.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="p-6 space-y-6 max-w-3xl">
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<div className="h-8 w-32 bg-muted animate-pulse rounded-lg" />
						<div className="h-4 w-48 bg-muted animate-pulse rounded-lg" />
					</div>
					<div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
				</div>
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
				))}
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6 max-w-3xl">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Settings</h1>
					<p className="text-muted-foreground">Platform configuration</p>
				</div>
				<div className="flex items-center gap-3">
					{saved && (
						<Badge variant="secondary" className="text-green-600">
							Saved
						</Badge>
					)}
					<Button onClick={handleSave} disabled={saving}>
						{saving ? (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<Save className="h-4 w-4 mr-2" />
						)}
						Save Settings
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>General</CardTitle>
					<CardDescription>Basic platform configuration</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="platformName">Platform Name</Label>
						<Input
							id="platformName"
							value={settings.platformName}
							onChange={(e) =>
								setSettings((s) => ({ ...s, platformName: e.target.value }))
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Access Control</CardTitle>
					<CardDescription>Control who can access the platform</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Enrollment Open</Label>
							<p className="text-sm text-muted-foreground">
								Allow new users to enroll in courses
							</p>
						</div>
						<Switch
							checked={settings.enrollmentOpen}
							onCheckedChange={(checked) =>
								setSettings((s) => ({ ...s, enrollmentOpen: checked }))
							}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<div className="flex items-center gap-2">
								<Label>Maintenance Mode</Label>
								<AlertTriangle className="h-4 w-4 text-yellow-500" />
							</div>
							<p className="text-sm text-muted-foreground">
								Disables all access except for admins
							</p>
						</div>
						<Switch
							checked={settings.maintenanceMode}
							onCheckedChange={(checked) =>
								setSettings((s) => ({ ...s, maintenanceMode: checked }))
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Defaults</CardTitle>
					<CardDescription>
						Default values for course and XP configuration
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="maxCourses">Max Courses per User</Label>
							<Input
								id="maxCourses"
								type="number"
								value={settings.maxCoursesPerUser}
								onChange={(e) =>
									setSettings((s) => ({
										...s,
										maxCoursesPerUser: Number(e.target.value),
									}))
								}
								min={1}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="defaultXp">Default XP per Lesson</Label>
							<Input
								id="defaultXp"
								type="number"
								value={settings.defaultXpPerLesson}
								onChange={(e) =>
									setSettings((s) => ({
										...s,
										defaultXpPerLesson: Number(e.target.value),
									}))
								}
								min={0}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
