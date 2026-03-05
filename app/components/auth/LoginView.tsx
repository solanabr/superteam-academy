/**
 * @fileoverview Legacy or standalone Login view.
 * Primarily used before the unified AuthView was implemented or for specific redirects.
 */
"use client";

import {
	EnvelopeSimpleIcon,
	LockKeyIcon,
	ShieldCheckIcon,
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
import { signIn } from "@/lib/auth/client";

/**
 * A dedicated view for traditional email/password login.
 */
export function LoginView() {
	const t = useTranslations("Auth");
	const locale = useLocale();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleEmailLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || !password) return;
		setLoading(true);
		try {
			const res = await signIn.email({
				email,
				password,
				callbackURL: `/${locale}/dashboard`,
			});
			if (res.error) {
				toast.error(res.error.message || t("login.error"));
			} else {
				// Identify user and capture login event
				posthog.identify(email, {
					email,
				});
				posthog.capture("user_signed_in", {
					method: "email",
					email,
				});
				toast.success(t("login.success") || "Successfully authenticated!");
				window.location.href = `/${locale}`;
			}
		} catch (error) {
			posthog.captureException(error);
			toast.error(
				(error as Error)?.message || "An error occurred during sign in",
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
						{t("shared.brandingBadgeLogin")}
					</span>
					<h1 className="font-barlow text-6xl font-bold uppercase tracking-wider text-ink-primary mb-6 leading-[0.9] whitespace-pre-line">
						{t("shared.brandingTitleLogin")}
					</h1>
					<p className="font-mono text-sm text-ink-secondary leading-relaxed">
						{t("shared.brandingDescLogin")}
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
							{t("login.title")}
						</h1>
						<p className="font-mono text-sm text-ink-secondary">
							{t("login.subtitle")}
						</p>
					</div>

					{/* Auth Card */}
					<div className="bg-bg-surface border border-ink-secondary/20 p-8 relative overflow-hidden shadow-2xl">
						<div className="absolute inset-0 bg-ink-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-1000" />

						<div className="relative z-10 space-y-6">
							{/* Value Proposition */}
							<div className="flex items-start gap-4 p-4 border border-ink-secondary/10 bg-bg-base/50">
								<ShieldCheckIcon
									className="w-5 h-5 text-ink-primary shrink-0 mt-0.5"
									weight="duotone"
								/>
								<div>
									<h3 className="text-xs font-bold font-mono tracking-widest text-ink-primary mb-1 uppercase">
										Persistent Identity
									</h3>
									<p className="text-xs font-mono text-ink-secondary leading-relaxed">
										Your progress, achievements, and courses are securely tied
										to your preferred identity provider.
									</p>
								</div>
							</div>

							{/* Email/Password Form */}
							<form
								onSubmit={handleEmailLogin}
								className="flex flex-col gap-4 pt-2"
							>
								<div className="relative">
									<EnvelopeSimpleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />
									<input
										type="email"
										placeholder={t("login.emailPlaceholder")}
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
										placeholder={t("login.passwordPlaceholder")}
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
									{loading ? t("login.authenticating") : t("login.button")}
								</button>
							</form>

							<div className="relative flex items-center py-2">
								<div className="grow border-t border-ink-secondary/20"></div>
								<span className="shrink-0 mx-4 text-ink-secondary text-xs font-mono">
									{t("shared.orContinueWith")}
								</span>
								<div className="grow border-t border-ink-secondary/20"></div>
							</div>

							{/* Sign In Options */}
							<div className="pt-2">
								<div className="flex flex-col gap-4 items-center justify-center">
									<AuthWalletButton />
								</div>
							</div>
						</div>
					</div>

					{/* Footer Links */}
					<div className="mt-8 text-center bg-bg-base/30 relative z-10 px-4 py-2 rounded-full backdrop-blur-sm border border-ink-secondary/10 mx-auto w-fit block">
						<p className="text-sm font-mono text-ink-secondary">
							{t("login.noAccount")}{" "}
							<Link
								href="/auth/signup"
								className="text-ink-primary hover:opacity-80 font-bold tracking-wide transition-colors uppercase ml-1"
							>
								{t("login.createLink")}
							</Link>
						</p>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
