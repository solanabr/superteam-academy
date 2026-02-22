"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
	name: string;
	email: string;
	bio: string;
	location: string;
	website: string;
	avatar: string;
}

export function ProfileSettings() {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [profile, setProfile] = useState<ProfileData>({
		name: "Alex Chen",
		email: "alex@example.com",
		bio: "Solana developer passionate about Web3 education",
		location: "San Francisco, CA",
		website: "https://github.com/alexchen",
		avatar: "/avatars/alex.jpg",
	});

	const handleSave = async () => {
		setIsLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toast({ title: "Profile updated", description: "Your changes have been saved." });
		} catch {
			toast({
				title: "Error",
				description: "Failed to save changes.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const url = URL.createObjectURL(file);
			setProfile((prev) => ({ ...prev, avatar: url }));
		}
	};

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
			<div className="px-6 py-4 border-b border-border/40">
				<h3 className="font-semibold text-sm">Profile Information</h3>
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
									Change photo
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
						<p className="text-[10px] text-muted-foreground mt-1">JPG, PNG. Max 2MB.</p>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="name" className="text-xs">
							Name
						</Label>
						<Input
							id="name"
							value={profile.name}
							onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="email" className="text-xs">
							Email
						</Label>
						<Input
							id="email"
							type="email"
							value={profile.email}
							onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="location" className="text-xs">
							Location
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
							Website
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
						Bio
					</Label>
					<Textarea
						id="bio"
						value={profile.bio}
						onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
						rows={3}
					/>
					<p className="text-[10px] text-muted-foreground">
						Brief description for your profile. Max 160 characters.
					</p>
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
