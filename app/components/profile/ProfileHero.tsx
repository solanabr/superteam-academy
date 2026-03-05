/**
 * @fileoverview Component for displaying user profile header, including avatar, bio, and social links.
 */
"use client";

import {
	GithubLogoIcon,
	GlobeIcon,
	MapPinIcon,
	XLogoIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { CustomAvatar } from "@/components/shared/CustomAvatar";
import { UserProfile } from "@/lib/data/user";

/** The core user profile information. */
interface ProfileHeroProps {
	profile: UserProfile;
	xp?: number;
	level?: number;
}

/**
 * ProfileHero Component
 * Displays the prominent header section of the profile with avatar, level, bio, and social links.
 */
export function ProfileHero({ profile, xp, level }: ProfileHeroProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-10 p-8 border border-border bg-bg-surface relative">
			{/* Corner crosshairs */}
			<div className="absolute -top-1 -left-1 w-2.5 h-2.5">
				<div className="absolute w-full h-px bg-ink-secondary top-1/2"></div>
				<div className="absolute h-full w-px bg-ink-secondary left-1/2"></div>
			</div>
			<div className="absolute -top-1 -right-1 w-2.5 h-2.5">
				<div className="absolute w-full h-px bg-ink-secondary top-1/2"></div>
				<div className="absolute h-full w-px bg-ink-secondary left-1/2"></div>
			</div>

			{/* Left Column: Avatar & ID */}
			<div className="flex flex-col gap-4 items-center">
				<div className="w-[180px] h-[180px] border border-ink-primary bg-bg-surface relative overflow-hidden flex items-center justify-center">
					{profile.avatar ? (
						<Image
							src={profile.avatar}
							alt={profile.displayName}
							fill
							className="object-cover"
						/>
					) : (
						<CustomAvatar
							seed={profile.avatarSeed || profile.id}
							size={178}
							className="border-none"
						/>
					)}
				</div>
				<div className="w-full">
					<span className="w-full text-center bg-ink-primary text-bg-base px-2 py-1.5 text-[10px] uppercase tracking-widest block font-bold border border-ink-primary">
						OPERATOR_ID: {profile.walletAddress.slice(0, 8)}
					</span>
				</div>
			</div>

			{/* Right Column: Profile Info */}
			<div className="flex flex-col justify-between py-2">
				<div>
					<h1 className="font-display text-[56px] leading-[0.8] -tracking-wider uppercase">
						{profile.displayName}
					</h1>
					<div className="flex gap-4 mt-6">
						<span className="text-sm font-bold uppercase tracking-widest text-[#14F195] border-b-2 border-[#14F195]/30 pb-0.5">
							LVL {level ?? 1}
						</span>
						<span className="text-sm text-ink-secondary uppercase tracking-widest">
							{(xp ?? 0).toLocaleString()} XP
						</span>
					</div>
					<p className="text-ink-secondary max-w-[500px] mt-6 font-mono text-sm leading-relaxed border-l-2 border-ink-primary/10 pl-4">
						{profile.bio}
					</p>
				</div>

				<div className="mt-8">
					<div className="flex items-center gap-6 text-[10px] uppercase tracking-widest text-ink-secondary mb-6 font-mono opacity-70">
						<div className="flex items-center gap-1.5">
							ENROLLED SINCE: {profile.enrolledSince}
						</div>
						<div className="flex items-center gap-1.5">
							<MapPinIcon
								size={12}
								weight="fill"
								className="text-ink-primary"
							/>
							LOC: {profile.location}
						</div>
					</div>
					<div className="flex flex-wrap gap-3">
						{profile.socialLinks.github && (
							<a
								href={profile.socialLinks.github}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2.5 text-[10px] font-bold px-4 py-2 border border-ink-primary/20 bg-ink-primary/5 hover:bg-ink-primary hover:text-bg-base uppercase tracking-widest transition-all group"
							>
								<GithubLogoIcon
									size={16}
									weight="duotone"
									className="group-hover:scale-110 transition-transform"
								/>
								<span>{profile.socialLinks.githubHandle || "GITHUB"}</span>
							</a>
						)}
						{profile.socialLinks.twitter && (
							<a
								href={profile.socialLinks.twitter}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2.5 text-[10px] font-bold px-4 py-2 border border-ink-primary/20 bg-ink-primary/5 hover:bg-ink-primary hover:text-bg-base uppercase tracking-widest transition-all group"
							>
								<XLogoIcon
									size={16}
									weight="duotone"
									className="group-hover:scale-110 transition-transform"
								/>
								<span>{profile.socialLinks.twitterHandle || "X"}</span>
							</a>
						)}
						{profile.socialLinks.portfolio && (
							<a
								href={profile.socialLinks.portfolio}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2.5 text-[10px] font-bold px-4 py-2 border border-ink-primary/20 bg-ink-primary/5 hover:bg-ink-primary hover:text-bg-base uppercase tracking-widest transition-all group"
							>
								<GlobeIcon
									size={16}
									weight="duotone"
									className="group-hover:scale-110 transition-transform"
								/>
								<span>
									{profile.socialLinks.portfolioDisplay || "PORTFOLIO"}
								</span>
							</a>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
