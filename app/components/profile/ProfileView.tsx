/**
 * @fileoverview Main profile view component, assembling hero, stats, skills, and credentials.
 */
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { BadgeShowcase } from "@/components/profile/BadgeShowcase";
import { CourseLedger } from "@/components/profile/CourseLedger";
import { CredentialCard } from "@/components/profile/CredentialCard";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { SkillRadar } from "@/components/profile/SkillRadar";
import { StreakGraph } from "@/components/profile/StreakGraph";
import { StatCard } from "@/components/shared/StatCard";
import { Achievement } from "@/lib/data/achievements";
import {
	Credential,
	SkillRadar as SkillRadarType,
} from "@/lib/data/credentials";
import { CourseProgress, StreakDay, UserProfile } from "@/lib/data/user";
import { useCredentials } from "@/lib/hooks/use-course";
import { useOnchainStats } from "@/lib/hooks/use-onchain-stats";

/** Core user profile data, unlocked achievements, earned certificates, radar data,
 * courses, and global rank.
 */
interface ProfileViewProps {
	profile: UserProfile;
	achievements: Achievement[];
	credentials: Credential[];
	skillRadar: SkillRadarType;
	courses: CourseProgress[];
	globalRank: number;
	streakHistory: StreakDay[];
	isOwner?: boolean;
}

/**
 * ProfileView Component
 * The primary layout for the profile page, coordinating on-chain data syncing and sub-component rendering.
 */
export function ProfileView({
	profile,
	achievements,
	skillRadar,
	courses,
	globalRank,
	streakHistory,
	isOwner = false,
}: Omit<ProfileViewProps, "credentials">) {
	const { publicKey } = useWallet();
	const onchainStats = useOnchainStats(
		publicKey?.toString() || profile.walletAddress,
	);

	const xpValue = onchainStats.loading ? profile.reputation : onchainStats.xp;
	const levelValue = onchainStats.loading
		? profile.level || 1
		: onchainStats.level;

	const credentialWallet = publicKey?.toBase58() || profile.walletAddress;
	const { data: onchainCredentials, isLoading: credsLoading } =
		useCredentials(credentialWallet);

	interface HeliusAttribute {
		trait_type: string;
		value: string;
	}

	interface HeliusAsset {
		id: string;
		content?: {
			metadata?: {
				name?: string;
				attributes?: HeliusAttribute[];
			};
		};
	}

	// Only show real on-chain credentials
	const displayCredentials: Credential[] = [];
	if (onchainCredentials && onchainCredentials.length > 0) {
		(onchainCredentials as unknown as HeliusAsset[]).forEach((asset) => {
			// Find track level from attributes if exists
			const attributes = asset.content?.metadata?.attributes || [];
			const levelAttr = attributes.find((a) => a.trait_type === "Level");
			const trackAttr = attributes.find((a) => a.trait_type === "Track");

			const trackName =
				trackAttr?.value.toUpperCase() ||
				asset.content?.metadata?.name?.toUpperCase() ||
				"CERTIFICATE";

			// Determine gradient and icon based on track/name
			let gradient = "linear-gradient(45deg, #1a1a1a 0%, #333333 100%)";
			let icon = "bi-shield-check";

			if (trackName.includes("RUST")) {
				gradient = "linear-gradient(45deg, #E44D26 0%, #F16529 100%)";
				icon = "bi-cpu";
			} else if (trackName.includes("ANCHOR")) {
				gradient = "linear-gradient(45deg, #3776AB 0%, #007396 100%)";
				icon = "bi-anchor";
			} else if (trackName.includes("DEFI")) {
				gradient = "linear-gradient(45deg, #00FFA3 0%, #03E1FF 100%)";
				icon = "bi-currency-exchange";
			} else if (trackName.includes("SECURITY")) {
				gradient = "linear-gradient(45deg, #FF4B2B 0%, #FF416C 100%)";
				icon = "bi-shield-lock";
			} else if (trackName.includes("LEVEL") || trackName.includes("STAGE")) {
				gradient = "linear-gradient(45deg, #F093FB 0%, #F5576C 100%)";
				icon = "bi-lightning-charge";
			}

			displayCredentials.push({
				id: asset.id,
				track: trackName,
				level: levelAttr ? parseInt(levelAttr.value) : 1,
				tier: "VERIFIED",
				mintAddress: asset.id,
				gradient,
				icon,
				verified: true,
			});
		});
	}
	return (
		<div className="min-h-screen bg-bg-base">
			{/* App Shell Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr_400px] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full">
				{/* Top Bar - spans all columns */}
				<div className="col-span-1 lg:col-span-3">
					<TopBar />
				</div>

				{/* Nav Rail */}
				<NavRail />

				{/* Main Stage */}
				<section className="p-4 lg:p-8 overflow-visible lg:overflow-y-auto flex flex-col gap-10">
					{/* Profile Hero */}
					<ProfileHero profile={profile} xp={xpValue} level={levelValue} />

					{/* Skill Matrix */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<SkillRadar skills={skillRadar} />
						<BadgeShowcase achievements={achievements} />
					</div>

					{/* Streak Graph */}
					<StreakGraph history={streakHistory} />

					{/* Credentials */}
					<div>
						<div className="flex justify-between items-end mb-6 border-b border-border pb-2">
							<div>
								<span className="bg-ink-primary text-bg-base px-2 py-1 text-[10px] uppercase tracking-widest inline-block mb-2">
									ON-CHAIN_PROOFS
								</span>
								<h2 className="font-display text-2xl lg:text-[32px] leading-none -tracking-wider">
									EVOLVING cNFTs
								</h2>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
							{displayCredentials.map((credential) => (
								<CredentialCard key={credential.id} credential={credential} />
							))}
							{credsLoading && (
								<div className="p-8 border border-dashed border-border flex items-center justify-center text-[10px] uppercase tracking-widest text-ink-secondary">
									Syncing On-Chain Proofs...
								</div>
							)}
						</div>
					</div>
				</section>

				{/* Context Panel (Right Sidebar) */}
				<aside className="border-t lg:border-t-0 lg:border-l border-border bg-bg-base p-6 flex flex-col gap-8 overflow-visible lg:overflow-y-auto">
					{/* Quick Stats */}
					<div className="border border-border bg-bg-surface p-4 relative">
						<span className="absolute -top-2.5 left-3 bg-bg-base px-2 text-[10px] uppercase tracking-widest font-bold">
							QUICK_STATS
						</span>
						<div className="grid grid-cols-2 gap-4">
							<StatCard label="RANK" value={`#${globalRank}`} />
							<StatCard label="VOUCHERS" value="12" />
						</div>
					</div>

					{/* Course Ledger */}
					<CourseLedger courses={courses} />

					{/* Metadata JSON */}
					{isOwner && (
						<div className="mt-auto">
							<div className="mb-2">
								<span className="text-[10px] font-bold uppercase tracking-widest">
									METADATA.JSON
								</span>
							</div>
							<div className="bg-ink-primary/5 p-3 font-mono text-[11px] leading-relaxed">
								{`{`}
								<br />
								&nbsp;&nbsp;&quot;operator&quot;: &quot;{profile.walletAddress}
								&quot;,
								<br />
								&nbsp;&nbsp;&quot;reputation&quot;: {xpValue},
								<br />
								&nbsp;&nbsp;&quot;class&quot;: &quot;Architect&quot;,
								<br />
								&nbsp;&nbsp;&quot;verified&quot;: true
								<br />
								{`}`}
							</div>
						</div>
					)}
				</aside>
			</div>
		</div>
	);
}
