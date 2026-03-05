/**
 * @fileoverview Legacy or standalone Signup view.
 * Handles the registration flow, including email/password setup and Web3 onboarding initiation.
 */
"use client";

import {
	CpuIcon,
	EnvelopeSimpleIcon,
	LockKeyIcon,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import { AuthWalletButton } from "@/components/auth/AuthWalletButton";
import { LanguageDropdown } from "@/components/LanguageDropdown";
import { DotGrid } from "@/components/shared/DotGrid";
import { Logo } from "@/components/shared/logo";
import { ModeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/routing";
import { signUp } from "@/lib/auth/client";

/**
 * A dedicated view for user registration.
 */
export function SignupView() {
	const t = useTranslations("Auth");
	const locale = useLocale();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleEmailSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || !password) return;
		setLoading(true);
		try {
			const res = await signUp.email({
				email,
				password,
				name: email.split("@")[0], // default name
				callbackURL: `/${locale}/onboarding`,
			});
			if (res.error) {
				toast.error(res.error.message || t("signup.error"));
			} else {
				// Identify user and capture signup event
				posthog.identify(email, {
					email,
					name: email.split("@")[0],
				});
				posthog.capture("user_signed_up", {
					method: "email",
					email,
				});
				toast.success(
					t("signup.success") || "Successfully initialized operator!",
				);
				window.location.href = `/${locale}`;
			}
		} catch (error) {
			posthog.captureException(error);
			toast.error(
				(error as Error)?.message || "An error occurred during sign up",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex bg-bg-base relative">
			{/* Left Column - Branding (Desktop Only) */}
			<div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden border-r border-ink-secondary/20">
				<DotGrid opacity={0.05} />
				<Link
					href="/"
					className="relative z-10 flex items-center gap-4 hover:opacity-80 transition-opacity w-max"
				>
					<Logo className="h-6 w-auto text-ink-primary" />
					<span className="font-bold uppercase tracking-widest text-[13px]">
						SUPERTEAM ACADEMY
					</span>
				</Link>

				<div className="relative z-10 max-w-lg">
					<span className="inline-block px-3 py-1 bg-ink-primary text-bg-base text-xs font-bold uppercase tracking-widest mb-6 border border-ink-primary">
						{t("shared.brandingBadgeSignup")}
					</span>
					<h1 className="font-barlow text-6xl font-bold uppercase tracking-wider text-ink-primary mb-6 leading-[0.9] whitespace-pre-line">
						{t("shared.brandingTitleSignup")}
					</h1>
					<p className="font-mono text-sm text-ink-secondary leading-relaxed">
						{t("shared.brandingDescSignup")}
					</p>
				</div>

				<div className="relative z-10 text-xs font-mono text-ink-secondary font-bold tracking-widest uppercase">
					{t("shared.systemOnline")}
				</div>
			</div>

			{/* Right Column - Form */}
			<div className="w-full lg:flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative bg-bg-surface overflow-y-auto">
				{/* Top Right Utilities */}
				<div className="absolute top-6 right-6 flex items-center gap-4 z-50">
					<LanguageDropdown variant="detailed" />
					<ModeToggle />
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="w-full max-w-md relative z-10 py-12"
				>
					{/* Mobile Only Header (If shown on small screens) */}
					<div className="lg:hidden flex items-center justify-center mb-8">
						<Logo className="h-8 w-auto text-ink-primary" />
					</div>

					{/* Header Section */}
					<div className="text-center mb-8">
						<h1 className="font-barlow text-4xl font-bold mb-3 uppercase tracking-wider text-ink-primary">
							{t("signup.title")}
						</h1>
						<p className="font-mono text-sm text-ink-secondary">
							{t("signup.subtitle")}
						</p>
					</div>

					{/* Auth Card */}
					<div className="bg-bg-surface border border-ink-secondary/20 p-8 relative overflow-hidden shadow-2xl">
						<div className="absolute inset-0 bg-ink-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-1000" />

						<div className="relative z-10 space-y-6">
							{/* Value Proposition */}
							<div className="flex items-start gap-4 p-4 border border-ink-secondary/10 bg-bg-base/50">
								<CpuIcon
									className="w-5 h-5 text-ink-primary shrink-0 mt-0.5"
									weight="duotone"
								/>
								<div>
									<h3 className="text-xs font-bold font-mono tracking-widest text-ink-primary mb-1 uppercase">
										{t("signup.web3Native")}
									</h3>
									<p className="text-xs font-mono text-ink-secondary leading-relaxed">
										{t("signup.web3NativeDesc")}
									</p>
								</div>
							</div>

							{/* Email/Password Form */}
							<form
								onSubmit={handleEmailSignup}
								className="flex flex-col gap-4 pt-2"
							>
								<div className="relative">
									<EnvelopeSimpleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />
									<input
										type="email"
										placeholder={t("signup.emailPlaceholder")}
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										className="w-full bg-bg-base border border-ink-secondary/20 py-2.5 pl-10 pr-4 text-sm text-ink-primary focus:outline-none focus:border-ink-primary transition-colors font-mono"
									/>
								</div>
								<div className="relative">
									<LockKeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />
									<input
										type="password"
										placeholder={t("signup.passwordPlaceholder")}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										className="w-full bg-bg-base border border-ink-secondary/20 py-2.5 pl-10 pr-4 text-sm text-ink-primary focus:outline-none focus:border-ink-primary transition-colors font-mono"
									/>
								</div>
								<button
									type="submit"
									disabled={loading}
									className="w-full bg-ink-primary hover:bg-ink-secondary text-bg-base font-bold py-3 mt-2 transition-colors uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2"
								>
									{loading ? (
										<div className="w-4 h-4 border-2 border-bg-struct/30 border-t-bg-struct rounded-full animate-spin" />
									) : null}
									{loading ? t("signup.initializing") : t("signup.button")}
								</button>
							</form>

							<div className="relative flex items-center py-2">
								<div className="grow border-t border-ink-secondary/20"></div>
								<span className="shrink-0 mx-4 text-ink-secondary text-xs font-mono">
									{t("shared.orContinueWith")}
								</span>
								<div className="grow border-t border-ink-secondary/20"></div>
							</div>

							{/* Sign Up Options */}
							<div className="pt-2">
								<div className="flex flex-col gap-4 items-center justify-center">
									<AuthWalletButton />
								</div>
							</div>
						</div>
					</div>

					{/* Footer Links */}
					<div className="mt-8 text-center">
						<p className="text-sm font-mono text-ink-secondary">
							{t("signup.hasAccount")}{" "}
							<Link
								href="/auth/login"
								className="text-ink-primary hover:opacity-80 font-bold tracking-wide transition-colors uppercase ml-1"
							>
								{t("signup.loginLink")}
							</Link>
						</p>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
