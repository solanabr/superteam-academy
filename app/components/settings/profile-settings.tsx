"use client";

import { useState, useEffect } from "react";
import { Camera, Check, X } from "lucide-react";
import { useRouter } from "@bprogress/next/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { useSettingsSave } from "@/hooks/use-settings";
import { useUsernameValidation } from "@/hooks/use-username-validation";
import { isValidUsername } from "@/lib/username-utils";

interface ProfileData {
	name: string;
	email: string;
	username: string;
	bio: string;
	location: string;
	website: string;
	avatar: string;
}

export function ProfileSettings() {
	const t = useTranslations("settings.profileSection");
	const { toast } = useToast();
	const router = useRouter();
	const {
		data,
		loading,
		saving: isLoading,
		handleSave: saveSettings,
	} = useSettingsSave({
		successTitle: t("toast.updatedTitle"),
		successDescription: t("toast.updatedDescription"),
		errorTitle: t("toast.errorTitle"),
		errorDescription: t("toast.errorDescription"),
		onSuccess: () => router.refresh(),
	});
	const {
		checking: usernameChecking,
		available: usernameAvailable,
		debouncedCheck: checkUsername,
	} = useUsernameValidation();
	const [profile, setProfile] = useState<ProfileData>({
		name: "",
		email: "",
		username: "",
		bio: "",
		location: "",
		website: "",
		avatar: "",
	});

	useEffect(() => {
		if (!data) return;
		setProfile({
			name: data.profile.name,
			email: data.profile.email,
			username: data.profile.username || "",
			bio: data.profile.bio,
			location: data.profile.location,
			website: data.profile.website,
			avatar: data.profile.image || "",
		});
	}, [data]);

	const handleUsernameChange = (value: string) => {
		setProfile((prev) => ({ ...prev, username: value }));
		checkUsername(value);
	};

	const handleSave = async () => {
		if (profile.username && !(await isValidUsername(profile.username))) {
			toast({
				title: t("toast.invalidUsernameTitle"),
				description: t("toast.invalidUsernameDescription"),
				variant: "destructive",
			});
			return;
		}

		if (profile.username && usernameAvailable === false) {
			toast({
				title: t("toast.usernameUnavailableTitle"),
				description: t("toast.usernameUnavailableDescription"),
				variant: "destructive",
			});
			return;
		}

		saveSettings({
			name: profile.name,
			email: profile.email,
			username: profile.username,
			bio: profile.bio,
			location: profile.location,
			website: profile.website,
		});
	};

	const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const url = URL.createObjectURL(file);
			setProfile((prev) => ({ ...prev, avatar: url }));
		}
	};

	if (loading) {
		return (
			<div className="rounded-2xl border border-border/60 bg-card p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-16 w-16 rounded-full bg-muted" />
					<div className="h-4 w-48 bg-muted rounded" />
					<div className="h-4 w-32 bg-muted rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
			<div className="px-6 py-4 border-b border-border/40">
				<h3 className="font-semibold text-sm">{t("title")}</h3>
			</div>

			<div className="p-6 space-y-6">
				<div className="flex items-center gap-4">
					<Avatar className="h-16 w-16">
						<AvatarImage src={profile.avatar} alt={profile.name} />
						<AvatarFallback className="text-lg bg-primary/10 text-primary">
							{profile.name.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<div>
						<Label htmlFor="avatar-upload" className="cursor-pointer">
							<Button variant="outline" size="sm" asChild>
								<span>
									<Camera className="h-3.5 w-3.5 mr-1.5" />
									{t("changePhoto")}
								</span>
							</Button>
						</Label>
						<input
							id="avatar-upload"
							type="file"
							accept="image/*"
							onChange={handleAvatarChange}
							className="hidden"
						/>
						<p className="text-[10px] text-muted-foreground mt-1">{t("photoHelp")}</p>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="name" className="text-xs">
							{t("fields.name")}
						</Label>
						<Input
							id="name"
							value={profile.name}
							onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="email" className="text-xs">
							{t("fields.email")}
						</Label>
						<Input
							id="email"
							type="email"
							value={profile.email}
							onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
						/>
					</div>
					<div className="space-y-1.5 sm:col-span-2">
						<Label htmlFor="username" className="text-xs">
							{t("fields.username")}
						</Label>
						<div className="relative">
							<Input
								id="username"
								value={profile.username}
								onChange={(e) => handleUsernameChange(e.target.value)}
								placeholder={t("placeholders.username")}
								className={
									profile.username && usernameAvailable === false
										? "border-destructive"
										: ""
								}
							/>
							{profile.username && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2">
									{usernameChecking ? (
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
									) : usernameAvailable === true ? (
										<Check className="h-4 w-4 text-green-500" />
									) : usernameAvailable === false ? (
										<X className="h-4 w-4 text-destructive" />
									) : null}
								</div>
							)}
						</div>
						<p className="text-[10px] text-muted-foreground">
							{t("usernameHelp")}
							{usernameAvailable === false && ` ${t("usernameTaken")}`}
							{usernameAvailable === true && ` ${t("usernameAvailable")}`}
						</p>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="location" className="text-xs">
							{t("fields.location")}
						</Label>
						<Input
							id="location"
							value={profile.location}
							onChange={(e) =>
								setProfile((p) => ({ ...p, location: e.target.value }))
							}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="website" className="text-xs">
							{t("fields.website")}
						</Label>
						<Input
							id="website"
							value={profile.website}
							onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="bio" className="text-xs">
						{t("fields.bio")}
					</Label>
					<Textarea
						id="bio"
						value={profile.bio}
						onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
						rows={3}
					/>
					<p className="text-[10px] text-muted-foreground">{t("bioHelp")}</p>
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
