/**
 * @fileoverview Unified authentication view component.
 * Handles the combined login and signup interface, providing a smooth transition
 * between modes based on email existence checks.
 */
"use client";

import {
	CaretRightIcon,
	EnvelopeSimpleIcon,
	ListIcon,
	LockKeyIcon,
} from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthWalletButton } from "@/components/auth/AuthWalletButton";
import { LanguageDropdown } from "@/components/LanguageDropdown";
import { DotGrid } from "@/components/shared/DotGrid";
import { Logo } from "@/components/shared/logo";
import { ModeToggle } from "@/components/theme-toggle";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Link, useRouter } from "@/i18n/routing";
import { checkEmailExists } from "@/lib/actions/checkEmail";
import { signIn, signUp, useSession } from "@/lib/auth/client";

/**
 * Validation schema for email/password authentication.
 */
const authSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Valid authentication modes.
 */
type AuthMode = "idle" | "login" | "signup";

/**
 * The main AuthView component.
 * Features:
 * - Real-time email validation and existence check.
 * - Unified form for login/signup with dynamic branding.
 * - Integration with Solana wallet and OAuth providers.
 */
export function AuthView() {
	const t = useTranslations("Auth");
	const locale = useLocale();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [mode, setMode] = useState<AuthMode>("idle");
	const [isChecking, setIsChecking] = useState(false);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [hasAuthError, setHasAuthError] = useState(false);
	const [formErrors, setFormErrors] = useState<{
		email?: string;
		password?: string;
	}>({});
	const session = useSession();

	useEffect(() => {
		console.log("[AuthView] Current session status:", {
			isPending: session.isPending,
			data: session.data,
			error: session.error,
		});

		if (session.data) {
			console.log("[AuthView] Session detected! Redirecting to dashboard...");
			router.push("/dashboard");
		}
	}, [session.data, session.isPending, session.error, router]);

	const authMutation = useMutation({
		mutationFn: async ({
			email,
			password,
			mode,
		}: {
			email: string;
			password: string;
			mode: "login" | "signup";
		}) => {
			if (mode === "login") {
				const res = await signIn.email({
					email,
					password,
					callbackURL: `/${locale}/dashboard`,
				});
				if (res.error)
					throw new Error(res.error.message || "Incorrect password.");
				return { type: "login" as const, data: res.data };
			} else {
				const res = await signUp.email({
					email,
					password,
					name: email.split("@")[0],
					callbackURL: `/${locale}/onboarding`,
				});
				if (res.error)
					throw new Error(res.error.message || "Failed to create account.");
				return { type: "signup" as const, data: res.data };
			}
		},
		onSuccess: async (result) => {
			if (result.type === "login") {
				toast.success(
					`Welcome back, ${result.data?.user?.name ?? "operator"}!`,
				);
			} else {
				toast.success("Operator initialized! Let's set up your profile.");
			}
			await session.refetch();
			// Redirection is handled in useEffect
		},
		onError: (error) => {
			setHasAuthError(true);
			toast.error(error.message);
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setFormErrors({});
		const validation = authSchema.safeParse({ email, password });
		if (!validation.success) {
			const errors: { email?: string; password?: string } = {};
			validation.error.issues.forEach((issue) => {
				if (issue.path[0] === "email") errors.email = issue.message;
				if (issue.path[0] === "password") errors.password = issue.message;
				toast.error(issue.message);
			});
			setFormErrors(errors);
			setHasAuthError(true);
			return;
		}

		authMutation.mutate({
			email,
			password,
			mode: isLogin ? "login" : "signup",
		});
	};

	// Detect mode on email blur — uses its own state, never touches form isPending
	const handleEmailBlur = useCallback(async () => {
		if (!email || !email.includes("@") || isChecking) return;
		setIsChecking(true);
		try {
			const exists = await checkEmailExists(email);
			setMode(exists ? "login" : "signup");
		} catch {
			// silently ignore — mode stays idle, submit will re-check anyway
		} finally {
			setIsChecking(false);
		}
	}, [email, isChecking]);
	const isLogin = mode === "login";
	const isSignup = mode === "signup";

	return (
		<div className="min-h-screen flex bg-bg-base relative">
			{/* Left Column - Branding */}
			<div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden border-r border-ink-secondary/20">
				<DotGrid opacity={0.25} />
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
					<AnimatePresence mode="wait">
						{isLogin ? (
							<motion.div
								key="login-brand"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
							>
								<span className="inline-block px-3 py-1 bg-ink-primary text-bg-base text-xs font-bold uppercase tracking-widest mb-6 border border-ink-primary">
									{t("shared.brandingBadgeLogin")}
								</span>
								<h1 className="font-barlow text-6xl font-bold uppercase tracking-wider text-ink-primary mb-6 leading-[0.9] whitespace-pre-line">
									{t("shared.brandingTitleLogin")}
								</h1>
								<p className="font-mono text-sm text-ink-secondary leading-relaxed">
									{t("shared.brandingDescLogin")}
								</p>
							</motion.div>
						) : (
							<motion.div
								key="signup-brand"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
							>
								<span className="inline-block px-3 py-1 bg-ink-primary text-bg-base text-xs font-bold uppercase tracking-widest mb-6 border border-ink-primary">
									{t("shared.brandingBadgeSignup")}
								</span>
								<h1 className="font-barlow text-6xl font-bold uppercase tracking-wider text-ink-primary mb-6 leading-[0.9] whitespace-pre-line">
									{t("shared.brandingTitleSignup")}
								</h1>
								<p className="font-mono text-sm text-ink-secondary leading-relaxed">
									{t("shared.brandingDescSignup")}
								</p>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<div className="relative z-10 text-xs font-mono text-ink-secondary font-bold tracking-widest uppercase">
					{t("shared.systemOnline")}
				</div>
			</div>

			{/* Right Column - Form */}
			<div className="w-full lg:flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-12 py-6 lg:py-12 relative bg-bg-surface overflow-y-auto min-h-screen lg:min-h-0">
				{/* Mobile Header Bar */}
				<div className="lg:hidden flex items-center justify-between w-full mb-6">
					<Link
						href="/"
						className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
					>
						<Logo className="h-7 w-auto text-ink-primary" />
						<span className="font-bold uppercase tracking-widest text-[11px] text-ink-primary">
							SUPERTEAM ACADEMY
						</span>
					</Link>

					{/* Sheet trigger — hamburger */}
					<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
						<SheetTrigger asChild>
							<button
								aria-label="Open settings"
								className="p-2 border border-ink-secondary/20 hover:border-ink-primary/40 transition-colors"
							>
								<ListIcon size={20} className="text-ink-primary" />
							</button>
						</SheetTrigger>
						<SheetContent
							side="right"
							className="bg-bg-surface border-l border-ink-secondary/20 w-[260px] p-0 flex flex-col"
						>
							<SheetHeader className="p-5 border-b border-ink-secondary/20">
								<SheetTitle className="flex items-center gap-2.5">
									<Logo className="h-5 w-auto text-ink-primary" />
									<span className="font-bold uppercase tracking-widest text-[11px] text-ink-primary">
										SUPERTEAM ACADEMY
									</span>
								</SheetTitle>
								<SheetDescription className="sr-only">
									Display settings
								</SheetDescription>
							</SheetHeader>
							<div className="flex flex-col gap-4 p-5">
								<div className="flex flex-col gap-2">
									<span className="text-[10px] uppercase tracking-widest text-ink-secondary font-bold">
										Language
									</span>
									<LanguageDropdown variant="detailed" />
								</div>
								<div className="flex flex-col gap-2">
									<span className="text-[10px] uppercase tracking-widest text-ink-secondary font-bold">
										Appearance
									</span>
									<ModeToggle />
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>

				{/* Desktop Top Right Utilities */}
				<div className="hidden lg:flex absolute top-6 right-6 items-center gap-4 z-50">
					<LanguageDropdown variant="detailed" />
					<ModeToggle />
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="w-full max-w-md relative z-10 sm:py-12"
				>
					{/* Header — changes based on detected mode */}
					<div className="text-center mb-6 sm:mb-8">
						<AnimatePresence mode="wait">
							{isLogin ? (
								<motion.div
									key="login-header"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
								>
									<h1 className="font-barlow text-2xl sm:text-4xl font-bold mb-3 uppercase tracking-wider text-ink-primary">
										{t("login.title")}
									</h1>
									<p className="font-mono text-sm text-ink-secondary">
										{t("login.subtitle")}
									</p>
								</motion.div>
							) : isSignup ? (
								<motion.div
									key="signup-header"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
								>
									<h1 className="font-barlow text-2xl sm:text-4xl font-bold mb-3 uppercase tracking-wider text-ink-primary">
										{t("signup.title")}
									</h1>
									<p className="font-mono text-sm text-ink-secondary">
										{t("signup.subtitle")}
									</p>
								</motion.div>
							) : (
								<motion.div
									key="idle-header"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
								>
									<h1 className="font-barlow text-2xl sm:text-4xl font-bold mb-3 uppercase tracking-wider text-ink-primary">
										{t("shared.accessProtocol")}
									</h1>
									<p className="font-mono text-sm text-ink-secondary">
										{t("shared.accessProtocolDesc")}
									</p>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Auth Card */}
					<div className="bg-bg-surface border border-ink-secondary/20 p-5 sm:p-8 relative overflow-hidden shadow-2xl">
						<div className="absolute inset-0 bg-ink-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-1000" />

						<div className="relative z-10 space-y-5">
							{/* Smart status indicator */}
							<AnimatePresence>
								{mode !== "idle" && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										exit={{ opacity: 0, height: 0 }}
										className="overflow-hidden"
									>
										<div
											className={`flex items-center gap-2 px-3 py-2 text-[11px] font-mono tracking-widest border ${
												isLogin
													? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
													: "border-ink-primary/20 bg-ink-primary/5 text-ink-primary"
											}`}
										>
											<div
												className={`w-1.5 h-1.5 rounded-full ${isLogin ? "bg-emerald-500" : "bg-ink-primary"} animate-pulse`}
											/>
											{isLogin
												? t("shared.returningOperator")
												: t("shared.newOperator")}
										</div>
									</motion.div>
								)}
							</AnimatePresence>

							{/* Form */}
							<form
								onSubmit={handleSubmit}
								noValidate
								className="flex flex-col gap-4"
							>
								{/* Email */}
								<div className="relative">
									<EnvelopeSimpleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />
									<input
										type="email"
										placeholder={t("login.emailPlaceholder")}
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);
											setMode("idle");
											setHasAuthError(false);
											setFormErrors((prev) => ({ ...prev, email: undefined }));
										}}
										onBlur={handleEmailBlur}
										required
										className={`w-full bg-bg-base border py-2.5 pl-10 pr-10 text-sm text-ink-primary focus:outline-none transition-colors font-mono ${
											formErrors.email ||
											email.length > 100 ||
											(mode !== "idle" && !email.includes("@"))
												? "border-red-500 focus:border-red-500"
												: "border-ink-secondary/20 focus:border-ink-primary"
										}`}
									/>
									{formErrors.email && (
										<p className="text-[10px] text-red-500 font-mono mt-1 font-bold uppercase tracking-wider">
											{formErrors.email}
										</p>
									)}
									{isChecking && (
										<div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-ink-secondary/30 border-t-ink-primary rounded-full animate-spin" />
									)}
								</div>

								{/* Password */}
								<div className="relative">
									<LockKeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-secondary" />
									<input
										type="password"
										placeholder={t("login.passwordPlaceholder")}
										value={password}
										onChange={(e) => {
											setPassword(e.target.value);
											setHasAuthError(false);
											setFormErrors((prev) => ({
												...prev,
												password: undefined,
											}));
										}}
										required
										className={`w-full bg-bg-base border py-2.5 pl-10 pr-4 text-sm text-ink-primary focus:outline-none transition-colors font-mono ${
											formErrors.password ||
											password.length > 128 ||
											hasAuthError
												? "border-red-500 focus:border-red-500"
												: "border-ink-secondary/20 focus:border-ink-primary"
										}`}
									/>
									{formErrors.password && (
										<p className="text-[10px] text-red-500 font-mono mt-1 font-bold uppercase tracking-wider">
											{formErrors.password}
										</p>
									)}
								</div>

								{/* Submit Button */}
								<button
									type="submit"
									disabled={authMutation.isPending}
									className="w-full bg-ink-primary hover:bg-ink-secondary text-bg-base font-bold py-3 mt-1 transition-colors uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2"
								>
									{authMutation.isPending && (
										<div className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
									)}
									{authMutation.isPending ? (
										isLogin ? (
											t("login.authenticating")
										) : (
											t("signup.initializing")
										)
									) : isLogin ? (
										t("login.button")
									) : isSignup ? (
										t("signup.button")
									) : (
										<div className="flex items-center gap-2">
											{t("shared.continue")}
											<CaretRightIcon size={14} weight="bold" />
										</div>
									)}
								</button>
							</form>

							{/* Divider */}
							<div className="relative flex items-center py-1">
								<div className="grow border-t border-ink-secondary/20" />
								<span className="shrink-0 mx-4 text-ink-secondary text-xs font-mono">
									{t("shared.orContinueWith")}
								</span>
								<div className="grow border-t border-ink-secondary/20" />
							</div>

							{/* Wallet Auth */}
							<div className="flex flex-col gap-3 items-center justify-center">
								<AuthWalletButton />
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
