/**
 * @fileoverview Main onboarding wizard component.
 * Orchestrates a multi-step process for setting up a user's identity, avatar,
 * profile details, learning tracks, and wallet connections.
 */
"use client";

import {
	ArrowLeftIcon,
	ArrowRightIcon,
	ArrowsClockwiseIcon,
	CheckIcon,
	CodeIcon,
	CpuIcon,
	CurrencyDollarIcon,
	DesktopIcon,
	GithubLogoIcon,
	GlobeIcon,
	MapPinIcon,
	ShieldCheckIcon,
	UserIcon,
	WalletIcon,
	XLogoIcon,
} from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { LanguageDropdown } from "@/components/LanguageDropdown";
import { CustomAvatar } from "@/components/shared/CustomAvatar";
import { DotGrid } from "@/components/shared/DotGrid";
import { Logo } from "@/components/shared/logo";
import { WalletModal } from "@/components/shared/WalletModal";
import { ModeToggle } from "@/components/theme-toggle";
import { updateUserProfile } from "@/lib/actions/updateProfile";
import { linkWalletAction } from "@/lib/actions/wallets";
import { authClient, linkSocial, useSession } from "@/lib/auth/client";

/**
 * Maps track IDs to their respective icons.
 */
const TRACK_ICONS: Record<string, React.ReactNode> = {
	rust: <CpuIcon weight="duotone" />,
	anchor: <CodeIcon weight="duotone" />,
	defi: <CurrencyDollarIcon weight="duotone" />,
	security: <ShieldCheckIcon weight="duotone" />,
	frontend: <DesktopIcon weight="duotone" />,
};

/**
 * Valid track identifiers.
 */
const TRACK_IDS = ["rust", "anchor", "defi", "security", "frontend"] as const;

/**
 * Total number of steps in the onboarding flow.
 */
const TOTAL_STEPS = 5;

/**
 * Google logo component.
 */
const GoogleIcon = () => (
	<svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
		<path
			fill="#4285F4"
			d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
		/>
		<path
			fill="#34A853"
			d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
		/>
		<path
			fill="#FBBC05"
			d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
		/>
		<path
			fill="#EA4335"
			d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
		/>
	</svg>
);

/**
 * GitHub logo component.
 */
const GitHubIcon = () => (
	<svg
		viewBox="0 0 24 24"
		className="w-4 h-4"
		fill="currentColor"
		aria-hidden="true"
	>
		<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.16 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
	</svg>
);

/**
 * The OnboardingView component.
 * Manages complex state across steps and persists final profile data to the database.
 */
export function OnboardingView() {
	const t = useTranslations("Onboarding");
	const locale = useLocale();
	const { data: session } = useSession();
	const [step, setStep] = useState(1);
	const [isPending, startTransition] = useTransition();
	const { publicKey, signMessage } = useWallet();
	const [walletModalOpen, setWalletModalOpen] = useState(false);
	const [isLinking, setIsLinking] = useState(false);
	const [isLinked, setIsLinked] = useState(false);

	// Step 1 — Identity
	const [name, setName] = useState(session?.user?.name ?? "");

	// Step 2 — Neural Signature (Avatar)
	const [avatarSeed, setAvatarSeed] = useState(() => {
		return session?.user?.id || Math.random().toString(36).substring(7);
	});

	const handleReroll = () => {
		setAvatarSeed(Math.random().toString(36).substring(2, 15));
	};

	// Step 3 — Bio & Social
	const [bio, setBio] = useState("");
	const [location, setLocation] = useState("");
	const [github, setGithub] = useState("");
	const [twitter, setTwitter] = useState("");
	const [website, setWebsite] = useState("");

	// Step 4 — Learning Tracks
	const [selectedTracks, setSelectedTracks] = useState<string[]>([]);

	// Restore state from session
	const [hasRestored, setHasRestored] = useState(false);

	useEffect(() => {
		if (session?.user && !hasRestored) {
			if (session.user.name) setName(session.user.name);
			const user = session.user as typeof session.user & {
				avatarSeed?: string;
				bio?: string;
				location?: string;
				github?: string;
				twitter?: string;
				website?: string;
				preferredTracks?: string;
			};
			if (user.avatarSeed) setAvatarSeed(user.avatarSeed);
			if (user.bio) setBio(user.bio);
			if (user.location) setLocation(user.location);
			if (user.github) setGithub(user.github);
			if (user.twitter) setTwitter(user.twitter);
			if (user.website) setWebsite(user.website);
			if (user.preferredTracks) {
				try {
					const tracks = JSON.parse(user.preferredTracks);
					if (Array.isArray(tracks)) setSelectedTracks(tracks);
				} catch (e) {
					console.error("Failed to parse tracks", e);
				}
			}
			setHasRestored(true);
		}
	}, [session, hasRestored]);

	const toggleTrack = (trackId: string) => {
		setSelectedTracks((prev) => {
			const isAdding = !prev.includes(trackId);
			const next = isAdding
				? [...prev, trackId]
				: prev.filter((t) => t !== trackId);
			posthog.capture("learning_track_selected", {
				track_id: trackId,
				action: isAdding ? "added" : "removed",
				selected_tracks: next,
			});
			return next;
		});
	};

	const handleLinkSocial = async (provider: "github" | "google") => {
		try {
			await linkSocial({
				provider,
				callbackURL: `/${locale}/onboarding`,
			});
		} catch (error) {
			console.error(`Failed to link ${provider}:`, error);
			toast.error(`Failed to link ${provider}`);
		}
	};
	const handleLinkWallet = async () => {
		if (!publicKey || !signMessage) {
			setWalletModalOpen(true);
			return;
		}

		try {
			setIsLinking(true);
			const message = `Link this wallet to Superteam Academy: ${Date.now()}`;
			const messageBytes = new TextEncoder().encode(message);
			const signedMessage = await signMessage(messageBytes);
			const signature = bs58.encode(signedMessage);

			const { error } = await linkWalletAction(
				publicKey.toBase58(),
				signature,
				message,
			);

			if (error) throw error;
			setIsLinked(true);
			posthog.capture("wallet_linked", {
				wallet_address: publicKey.toBase58(),
			});
			toast.success(t("step5.walletLinked") || "Wallet linked successfully");
		} catch (error) {
			console.error("Failed to link wallet:", error);
			toast.error(t("step5.walletError") || "Failed to link wallet");
		} finally {
			setIsLinking(false);
		}
	};

	const handleFinish = () => {
		startTransition(async () => {
			const result = await updateUserProfile({
				name: name || session?.user?.name,
				bio,
				location,
				github,
				twitter,
				website,
				avatarSeed,
				preferredTracks: JSON.stringify(selectedTracks),
				onboardingCompleted: true,
			});
			if (result?.error) {
				toast.error(result.error);
			} else {
				// Identify user with profile details and capture onboarding completion
				if (session?.user) {
					posthog.identify(session.user.id, {
						name,
						email: session.user.email,
						preferred_tracks: selectedTracks,
					});
				}
				posthog.capture("onboarding_completed", {
					selected_tracks: selectedTracks,
					has_bio: bio.length > 0,
					has_location: location.length > 0,
					has_github: github.length > 0,
					has_twitter: twitter.length > 0,
				});
				toast.success("Welcome aboard, operator!");
				// Force a session refresh and full-page navigation to avoid redirect loops
				await authClient.getSession();
				window.location.href = `/${locale}/dashboard`;
			}
		});
	};

	const canProceed = () => {
		if (step === 1) return name.trim().length > 0;
		if (step === 4) return selectedTracks.length > 0;
		return true; // steps 2, 3 and 5 are always skippable
	};

	return (
		<div className="min-h-screen flex bg-bg-base relative overflow-hidden">
			{/* Utilities - Top Right */}
			<div className="fixed top-6 right-6 z-50 flex items-center gap-3">
				<LanguageDropdown />
				<ModeToggle />
			</div>

			{/* Left Branding Panel */}
			<div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between p-12 relative overflow-hidden border-r border-ink-secondary/20">
				<DotGrid opacity={0.25} />
				<div className="relative z-10 flex items-center gap-3">
					<Logo className="h-6 w-auto text-ink-primary" />
					<span className="font-bold uppercase tracking-widest text-[13px]">
						SUPERTEAM ACADEMY
					</span>
				</div>

				<div className="relative z-10">
					<span className="inline-block px-3 py-1 bg-ink-primary text-bg-base text-[10px] font-bold uppercase tracking-widest mb-6 border border-ink-primary">
						{t("badge")}
					</span>
					<h1 className="font-barlow text-5xl font-bold uppercase tracking-wider text-ink-primary mb-4 leading-[0.9] whitespace-pre-line">
						{t("brandingTitle")}
					</h1>
					<p className="font-mono text-sm text-ink-secondary leading-relaxed">
						{t("brandingDesc")}
					</p>
				</div>

				{/* Step Indicators */}
				<div className="relative z-10 flex flex-col gap-4">
					{(
						[
							"identity",
							"signature",
							"profile",
							"learningPath",
							"wallet",
						] as const
					).map((key, i) => {
						const stepNumber = i + 1;
						const isCompleted = step > stepNumber;
						const isActive = step === stepNumber;

						return (
							<button
								key={key}
								onClick={() => setStep(stepNumber)}
								className="flex items-center gap-3 group text-left transition-all"
							>
								<div
									className={`w-6 h-6 border flex items-center justify-center text-[10px] font-bold transition-all ${
										isCompleted
											? "bg-ink-primary border-ink-primary text-bg-base"
											: isActive
												? "border-ink-primary text-ink-primary"
												: "border-ink-secondary/30 text-ink-secondary/30 group-hover:border-ink-secondary/60"
									}`}
								>
									{isCompleted ? (
										<CheckIcon size={12} weight="bold" />
									) : (
										stepNumber
									)}
								</div>
								<span
									className={`text-[11px] uppercase tracking-widest font-bold transition-all ${
										isActive
											? "text-ink-primary"
											: isCompleted
												? "text-ink-secondary group-hover:text-ink-primary"
												: "text-ink-secondary/30 group-hover:text-ink-secondary/60"
									}`}
								>
									{t(`steps.${key}`)}
								</span>
							</button>
						);
					})}
				</div>

				<div className="relative z-10 text-xs font-mono text-ink-secondary font-bold tracking-widest uppercase">
					{t("systemOnline")} {step}/{TOTAL_STEPS}
				</div>
			</div>

			{/* Right Form Panel */}
			<div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-bg-surface relative overflow-y-auto">
				{/* Progress Bar */}
				<div className="absolute top-0 left-0 right-0 h-0.5 bg-ink-secondary/10">
					<motion.div
						className="h-full bg-ink-primary"
						animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
						transition={{ duration: 0.4, ease: "easeOut" }}
					/>
				</div>

				<div className="w-full max-w-lg">
					{/* Mobile: Logo */}
					<div className="lg:hidden flex items-center justify-between mb-8">
						<div className="flex items-center gap-3">
							<Logo className="h-7 w-auto text-ink-primary" />
						</div>
					</div>

					<AnimatePresence mode="wait">
						{step === 1 && (
							<motion.div
								key="step1"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="flex flex-col gap-6"
							>
								<div>
									<span className="text-[10px] font-mono uppercase tracking-widest text-ink-secondary">
										{t("step1.badge")}
									</span>
									<h2 className="font-barlow text-3xl font-bold uppercase tracking-wider mt-1">
										{t("step1.title")}
									</h2>
									<p className="text-sm font-mono text-ink-secondary mt-2">
										{t("step1.subtitle")}
									</p>
								</div>

								<div className="flex flex-col gap-4">
									<div className="flex flex-col gap-1.5">
										<label className="text-[10px] font-bold uppercase tracking-widest text-ink-secondary">
											{t("step1.nameLabel")}
										</label>
										<div
											className={`relative border transition-colors ${name.length > 25 ? "border-red-500 focus-within:border-red-500" : "border-ink-secondary/30 focus-within:border-ink-primary"}`}
										>
											<UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-secondary" />
											<input
												type="text"
												value={name}
												onChange={(e) => setName(e.target.value)}
												placeholder={t("step1.namePlaceholder")}
												className="w-full bg-bg-base py-3 pl-9 pr-4 text-sm font-mono focus:outline-none"
											/>
										</div>
									</div>

									{session?.user?.email && (
										<div className="flex flex-col gap-1.5">
											<label className="text-[10px] font-bold uppercase tracking-widest text-ink-secondary">
												{t("step1.emailLabel")}
											</label>
											<input
												type="email"
												readOnly
												value={session.user.email}
												className="w-full bg-bg-base border border-ink-secondary/10 py-3 px-4 text-sm font-mono text-ink-secondary/60 cursor-not-allowed"
											/>
										</div>
									)}
								</div>
							</motion.div>
						)}

						{step === 2 && (
							<motion.div
								key="step2"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="flex flex-col gap-8 items-center text-center"
							>
								<div className="w-full text-left">
									<span className="text-[10px] font-mono uppercase tracking-widest text-ink-secondary">
										{t("step2.badge")}
									</span>
									<h2 className="font-barlow text-3xl font-bold uppercase tracking-wider mt-1">
										{t("step2.title")}
									</h2>
									<p className="text-sm font-mono text-ink-secondary mt-2">
										{t("step2.subtitle")}
									</p>
								</div>

								<div className="relative group p-4 border border-ink-primary/20 bg-bg-base/50">
									<div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-ink-primary" />
									<div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-ink-primary" />
									<div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-ink-primary" />
									<div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-ink-primary" />

									<CustomAvatar seed={avatarSeed} size={180} />
								</div>

								<div className="flex flex-col gap-4 w-full">
									<button
										type="button"
										onClick={handleReroll}
										className="flex items-center justify-center gap-3 bg-bg-base border border-ink-primary/30 py-4 px-6 text-xs font-bold uppercase tracking-widest hover:border-ink-primary transition-all group"
									>
										<ArrowsClockwiseIcon
											size={18}
											weight="bold"
											className="group-hover:rotate-180 transition-transform duration-500"
										/>
										{t("step2.reroll")}
									</button>
									<p className="text-[10px] font-mono text-ink-secondary leading-relaxed uppercase tracking-tighter opacity-60">
										{t("step2.description")}
									</p>
								</div>
							</motion.div>
						)}

						{step === 3 && (
							<motion.div
								key="step3"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="flex flex-col gap-6"
							>
								<div>
									<span className="text-[10px] font-mono uppercase tracking-widest text-ink-secondary">
										{t("step3.badge")}
									</span>
									<h2 className="font-barlow text-3xl font-bold uppercase tracking-wider mt-1">
										{t("step3.title")}
									</h2>
									<p className="text-sm font-mono text-ink-secondary mt-2">
										{t("step3.subtitle")}
									</p>
								</div>

								<div className="flex flex-col gap-4">
									<textarea
										value={bio}
										onChange={(e) => setBio(e.target.value)}
										placeholder={t("step3.bioPlaceholder")}
										rows={3}
										className={`w-full bg-bg-base border py-3 px-4 text-sm font-mono resize-none focus:outline-none transition-colors ${bio.length > 160 ? "border-red-500 focus:border-red-500" : "border-ink-secondary/30 focus:border-ink-primary"}`}
									/>
									<div
										className={`flex bg-bg-base border transition-colors ${location.length > 50 ? "border-red-500 focus-within:border-red-500" : "border-ink-secondary/30 focus-within:border-ink-primary"}`}
									>
										<div className="w-12 flex items-center justify-center bg-ink-secondary/5 border-r border-ink-secondary/30">
											<MapPinIcon className="w-4 h-4 text-ink-secondary" />
										</div>
										<input
											type="text"
											value={location}
											onChange={(e) => setLocation(e.target.value)}
											placeholder={t("step3.locationPlaceholder")}
											className="flex-1 bg-transparent py-3 px-4 text-sm font-mono focus:outline-none"
										/>
									</div>
									<div
										className={`flex bg-bg-base border transition-colors ${twitter.length > 30 ? "border-red-500 focus-within:border-red-500" : "border-ink-secondary/30 focus-within:border-ink-primary"}`}
									>
										<div className="w-12 flex items-center justify-center bg-ink-secondary/5 border-r border-ink-secondary/30">
											<XLogoIcon className="w-4 h-4 text-ink-secondary" />
										</div>
										<input
											type="text"
											value={twitter}
											onChange={(e) => setTwitter(e.target.value)}
											placeholder={t("step3.twitterPlaceholder")}
											className="flex-1 bg-transparent py-3 px-4 text-sm font-mono focus:outline-none"
										/>
									</div>
									<div
										className={`flex bg-bg-base border transition-colors ${github.length > 39 ? "border-red-500 focus-within:border-red-500" : "border-ink-secondary/30 focus-within:border-ink-primary"}`}
									>
										<div className="w-12 flex items-center justify-center bg-ink-secondary/5 border-r border-ink-secondary/30">
											<GithubLogoIcon className="w-4 h-4 text-ink-secondary" />
										</div>
										<input
											type="text"
											value={github}
											onChange={(e) => setGithub(e.target.value)}
											placeholder={t("step3.githubPlaceholder")}
											className="flex-1 bg-transparent py-3 px-4 text-sm font-mono focus:outline-none"
										/>
									</div>
									<div
										className={`flex bg-bg-base border transition-colors ${website.length > 100 ? "border-red-500 focus-within:border-red-500" : "border-ink-secondary/30 focus-within:border-ink-primary"}`}
									>
										<div className="w-12 flex items-center justify-center bg-ink-secondary/5 border-r border-ink-secondary/30">
											<GlobeIcon className="w-4 h-4 text-ink-secondary" />
										</div>
										<input
											type="text"
											value={website}
											onChange={(e) => setWebsite(e.target.value)}
											placeholder={t("step3.websitePlaceholder")}
											className="flex-1 bg-transparent py-3 px-4 text-sm font-mono focus:outline-none"
										/>
									</div>
								</div>
							</motion.div>
						)}

						{step === 4 && (
							<motion.div
								key="step4"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="flex flex-col gap-6"
							>
								<div>
									<span className="text-[10px] font-mono uppercase tracking-widest text-ink-secondary">
										{t("step4.badge")}
									</span>
									<h2 className="font-barlow text-3xl font-bold uppercase tracking-wider mt-1">
										{t("step4.title")}
									</h2>
									<p className="text-sm font-mono text-ink-secondary mt-2">
										{t("step4.subtitle")}
									</p>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{TRACK_IDS.map((id) => {
										const track = {
											id,
											label: t(`step4.tracks.${id}.label`),
											icon: TRACK_ICONS[id],
											desc: t(`step4.tracks.${id}.desc`),
										};
										const active = selectedTracks.includes(track.id);
										return (
											<button
												key={track.id}
												type="button"
												onClick={() => toggleTrack(track.id)}
												className={`flex items-center gap-4 p-4 border text-left transition-all ${
													active
														? "border-ink-primary bg-ink-primary/5"
														: "border-ink-secondary/20 hover:border-ink-secondary/60"
												}`}
											>
												<div
													className={`w-8 h-8 flex items-center justify-center shrink-0 text-lg transition-all ${
														active ? "text-ink-primary" : "text-ink-secondary"
													}`}
												>
													{track.icon}
												</div>
												<div className="flex-1">
													<div
														className={`text-xs font-bold uppercase tracking-widest ${active ? "text-ink-primary" : ""}`}
													>
														{track.label}
													</div>
													<div className="text-[11px] font-mono text-ink-secondary mt-0.5 line-clamp-1">
														{track.desc}
													</div>
												</div>
												<div
													className={`w-4 h-4 border shrink-0 flex items-center justify-center transition-all ${
														active
															? "bg-ink-primary border-ink-primary"
															: "border-ink-secondary/40"
													}`}
												>
													{active && (
														<CheckIcon
															size={10}
															weight="bold"
															className="text-bg-base"
														/>
													)}
												</div>
											</button>
										);
									})}
								</div>
							</motion.div>
						)}

						{step === 5 && (
							<motion.div
								key="step5"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="flex flex-col gap-6"
							>
								<div>
									<span className="text-[10px] font-mono uppercase tracking-widest text-ink-secondary">
										{t("step5.badge")}
									</span>
									<h2 className="font-barlow text-3xl font-bold uppercase tracking-wider mt-1">
										{t("step5.title")}
									</h2>
									<p className="text-sm font-mono text-ink-secondary mt-2">
										{t("step5.subtitle")}
									</p>
								</div>

								<div className="border border-ink-secondary/20 p-6 bg-bg-base/50 flex flex-col gap-6">
									<div className="flex flex-col gap-4">
										<div className="text-[10px] uppercase tracking-widest font-bold text-ink-secondary">
											{t("step5.requiredFor")}
										</div>
										<ul className="flex flex-col gap-2">
											{(t.raw("step5.requirements") as string[]).map(
												(item: string) => (
													<li
														key={item}
														className="flex items-center gap-2 text-xs font-mono text-ink-secondary"
													>
														<div className="w-1 h-1 bg-ink-primary rounded-full" />
														{item}
													</li>
												),
											)}
										</ul>
										<div className="pt-2">
											{isLinked ||
											session?.user?.walletAddress === publicKey?.toBase58() ? (
												<div className="flex items-center gap-2 text-green-600 font-mono text-xs font-bold bg-green-500/10 p-3 border border-green-500/20">
													<CheckIcon size={14} weight="bold" />
													{publicKey?.toBase58().slice(0, 4)}...
													{publicKey?.toBase58().slice(-4)} — LINKED
												</div>
											) : (
												<button
													type="button"
													onClick={handleLinkWallet}
													disabled={isLinking}
													className="w-full flex items-center justify-center gap-3 bg-ink-primary text-bg-base py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-ink-secondary transition-all disabled:opacity-50"
												>
													{isLinking ? (
														<div className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
													) : (
														<WalletIcon size={18} weight="duotone" />
													)}
													{publicKey
														? "Link Connected Wallet"
														: "Connect & Link Wallet"}
												</button>
											)}
										</div>
									</div>

									<div className="h-px bg-ink-secondary/10" />

									<div className="flex flex-col gap-3">
										<div className="text-[10px] uppercase tracking-widest font-bold text-ink-secondary">
											{t("step5.externalLabel")}
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<button
												type="button"
												onClick={() => handleLinkSocial("github")}
												className="flex items-center justify-between border border-border bg-bg-surface px-4 py-3 hover:bg-ink-primary hover:text-bg-base transition-colors group"
											>
												<span className="flex items-center gap-3 text-[11px] font-bold tracking-widest uppercase">
													<GitHubIcon />
													{t("step5.linkGithub")}
												</span>
												<ArrowRightIcon
													size={12}
													className="opacity-0 group-hover:opacity-100 transition-opacity"
												/>
											</button>
											<button
												type="button"
												onClick={() => handleLinkSocial("google")}
												className="flex items-center justify-between border border-border bg-bg-surface px-4 py-3 hover:bg-ink-primary hover:text-bg-base transition-colors group"
											>
												<span className="flex items-center gap-3 text-[11px] font-bold tracking-widest uppercase">
													<GoogleIcon />
													{t("step5.linkGoogle")}
												</span>
												<ArrowRightIcon
													size={12}
													className="opacity-0 group-hover:opacity-100 transition-opacity"
												/>
											</button>
										</div>
									</div>
								</div>

								<div className="flex flex-col gap-3">
									<button
										type="button"
										onClick={handleFinish}
										disabled={isPending}
										className="w-full bg-ink-primary text-bg-base py-4 text-xs font-bold uppercase tracking-widest hover:bg-ink-primary/90 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
									>
										{isPending && (
											<div className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
										)}
										{t("step5.launch")}
									</button>
									<div className="grid grid-cols-2 gap-3">
										<button
											type="button"
											onClick={() => setStep(4)}
											className="w-full flex items-center justify-center gap-2 border border-ink-secondary/20 bg-bg-base/50 py-3 text-[10px] font-bold uppercase tracking-widest text-ink-secondary hover:text-ink-primary hover:border-ink-primary transition-all"
										>
											<ArrowLeftIcon size={12} /> {t("nav.back")}
										</button>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Navigation */}
					{step < 5 && (
						<div className="flex gap-3 mt-10">
							{step > 1 && (
								<button
									type="button"
									onClick={() => setStep((s) => s - 1)}
									className="flex items-center gap-2 border border-ink-secondary/40 px-6 py-4 text-xs font-bold uppercase tracking-widest hover:border-ink-primary hover:bg-bg-base/50 transition-all shadow-sm"
								>
									<ArrowLeftIcon size={14} /> {t("nav.back")}
								</button>
							)}
							<button
								type="button"
								onClick={() => setStep((s) => s + 1)}
								disabled={!canProceed()}
								className="flex-1 flex items-center justify-center gap-2 bg-ink-primary text-bg-base py-4 text-xs font-bold uppercase tracking-widest hover:bg-ink-primary/90 transition-all shadow-xl disabled:opacity-40"
							>
								{step === 4 ? t("nav.continue") : t("nav.next")}{" "}
								<ArrowRightIcon size={14} />
							</button>
						</div>
					)}
				</div>
			</div>
			<WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
		</div>
	);
}
