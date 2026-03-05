/**
 * @fileoverview Profile settings component for managing user bio, location, and social links.
 */
"use client";

import {
	GithubLogoIcon,
	GlobeIcon,
	MapPinIcon,
	TextTIcon,
	UserCircleIcon,
	UserIcon,
	XLogoIcon,
} from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { toast } from "sonner";
import { CustomAvatar } from "@/components/shared/CustomAvatar";
import { updateUserProfile } from "@/lib/actions/updateProfile";
import { useSession } from "@/lib/auth/client";

// ─── Reusable labelled field wrapper ────────────────────────────────────────
function SettingsField({
	icon: Icon,
	label,
	children,
}: {
	icon: React.ElementType;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest flex items-center gap-1.5">
				<Icon size={11} weight="duotone" />
				{label}
			</label>
			{children}
		</div>
	);
}

export function ProfileSettings() {
	const t = useTranslations("Settings.profile");
	const { data: session, refetch, isPending: isSessionPending } = useSession();

	const user = session?.user;
	const typedUser = user as
		| (NonNullable<typeof user> & {
				avatarSeed?: string | null;
				bio?: string | null;
				location?: string | null;
				github?: string | null;
				twitter?: string | null;
				website?: string | null;
		  })
		| undefined;

	const avatarSeed = typedUser?.avatarSeed || typedUser?.id || "default";

	const [form, setForm] = useState({
		name: typedUser?.name ?? "",
		bio: typedUser?.bio ?? "",
		location: typedUser?.location ?? "",
		github: typedUser?.github ?? "",
		twitter: typedUser?.twitter ?? "",
		website: typedUser?.website ?? "",
	});

	const updateMutation = useMutation({
		mutationFn: async (formData: typeof form) => {
			const result = await updateUserProfile(formData);
			if (result?.error) throw new Error(result.error);
			return result;
		},
		onSuccess: () => {
			toast.success(t("saved"));
			refetch();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSave = () => {
		updateMutation.mutate(form);
	};

	return (
		<div className="border border-border bg-bg-surface p-6 flex flex-col gap-5">
			<div className="border-b border-border pb-2 mb-2 flex items-center gap-2 font-bold uppercase tracking-widest text-[11px]">
				<UserCircleIcon size={14} weight="duotone" /> {t("title")}
			</div>

			{/* Avatar & Display Name Grouping */}
			<div className="flex items-center gap-6">
				{/* Avatar */}
				<div className="relative group border border-ink-primary/20 bg-bg-base/50 shrink-0">
					<div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-ink-primary z-10" />
					<div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-ink-primary z-10" />
					<div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-ink-primary z-10" />
					<div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-ink-primary z-10" />

					<div className="w-16 h-16 relative overflow-hidden bg-ink-primary/5">
						{isSessionPending ? (
							<div className="w-full h-full bg-ink-primary/10 animate-pulse" />
						) : user?.image ? (
							<Image
								src={user.image}
								alt="Avatar"
								fill
								className="object-cover"
							/>
						) : (
							<CustomAvatar
								seed={avatarSeed}
								size={64}
								className="rounded-none border-none"
							/>
						)}
					</div>
				</div>

				{/* Display Name */}
				<div className="flex-1">
					<SettingsField icon={UserIcon} label={t("nameLabel")}>
						<div className="flex bg-transparent border border-ink-secondary/40 focus-within:border-ink-primary focus-within:bg-ink-primary/5 transition-colors">
							<div className="w-10 flex items-center justify-center bg-ink-secondary/5 border-r border-ink-secondary/30 shrink-0">
								<UserIcon className="w-4 h-4 text-ink-secondary" />
							</div>
							<input
								type="text"
								name="name"
								value={form.name}
								onChange={handleChange}
								placeholder={t("namePlaceholder")}
								className="w-full bg-transparent px-2.5 py-2.5 text-[13px] outline-none font-mono"
							/>
						</div>
					</SettingsField>
					<p className="text-[10px] text-ink-secondary tracking-widest leading-relaxed mt-2 hidden sm:block">
						{t("avatarHint")}
					</p>
				</div>
			</div>

			{/* Bio */}
			<SettingsField icon={TextTIcon} label={t("bioLabel")}>
				<textarea
					name="bio"
					value={form.bio}
					onChange={handleChange}
					placeholder={t("bioPlaceholder")}
					className="bg-transparent border border-ink-secondary/40 px-2.5 py-2.5 text-[13px] h-20 resize-none focus:border-ink-primary focus:bg-ink-primary/5 outline-none font-mono"
				/>
			</SettingsField>

			{/* Location */}
			<SettingsField icon={MapPinIcon} label={t("locationLabel")}>
				<div className="flex bg-transparent border border-ink-secondary/40 focus-within:border-ink-primary focus-within:bg-ink-primary/5 transition-colors">
					<div className="w-10 flex items-center justify-center bg-ink-secondary/5 border-r border-ink-secondary/30 shrink-0">
						<MapPinIcon className="w-4 h-4 text-ink-secondary" />
					</div>
					<input
						type="text"
						name="location"
						value={form.location}
						onChange={handleChange}
						placeholder={t("locationPlaceholder")}
						className="w-full bg-transparent px-2.5 py-2.5 text-[13px] outline-none font-mono"
					/>
				</div>
			</SettingsField>

			{/* Social Links */}
			<div className="flex flex-col gap-2">
				<label className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">
					{t("socialLabel")}
				</label>
				<div className="flex bg-transparent border border-ink-secondary/40 focus-within:border-ink-primary focus-within:bg-ink-primary/5 transition-colors">
					<div className="w-10 flex items-center justify-center bg-ink-secondary/5 border-r border-ink-secondary/30 shrink-0">
						<XLogoIcon className="w-4 h-4 text-ink-secondary" />
					</div>
					<input
						type="text"
						name="twitter"
						value={form.twitter}
						onChange={handleChange}
						placeholder={t("twitterPlaceholder")}
						className="w-full bg-transparent px-2.5 py-2.5 text-[13px] outline-none font-mono"
					/>
				</div>
				<div className="flex bg-transparent border border-ink-secondary/40 focus-within:border-ink-primary focus-within:bg-ink-primary/5 transition-colors">
					<div className="w-10 flex items-center justify-center bg-ink-secondary/5 border-r border-ink-secondary/30 shrink-0">
						<GithubLogoIcon className="w-4 h-4 text-ink-secondary" />
					</div>
					<input
						type="text"
						name="github"
						value={form.github}
						onChange={handleChange}
						placeholder={t("githubPlaceholder")}
						className="w-full bg-transparent px-2.5 py-2.5 text-[13px] outline-none font-mono"
					/>
				</div>
				<div className="flex bg-transparent border border-ink-secondary/40 focus-within:border-ink-primary focus-within:bg-ink-primary/5 transition-colors">
					<div className="w-10 flex items-center justify-center bg-ink-secondary/5 border-r border-ink-secondary/30 shrink-0">
						<GlobeIcon className="w-4 h-4 text-ink-secondary" />
					</div>
					<input
						type="text"
						name="website"
						value={form.website}
						onChange={handleChange}
						placeholder={t("websitePlaceholder")}
						className="w-full bg-transparent px-2.5 py-2.5 text-[13px] outline-none font-mono"
					/>
				</div>
			</div>

			<button
				onClick={handleSave}
				disabled={updateMutation.isPending}
				type="button"
				className="bg-ink-primary text-bg-base border border-ink-primary px-5 py-2.5 text-[12px] uppercase tracking-widest font-bold w-full hover:bg-ink-primary/90 transition-colors disabled:opacity-50"
			>
				{updateMutation.isPending ? t("saving") : t("save")}
			</button>
		</div>
	);
}
