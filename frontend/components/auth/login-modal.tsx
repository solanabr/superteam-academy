"use client";

import { useState, useCallback } from "react";
import { Mail, ArrowLeft, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";

interface LoginModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type Step = "choose" | "email" | "otp" | "wallet-verify";

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
	const { signInWithOAuth, wallet, verifyWallet, isWalletConnected } = useAuth();
	const [step, setStep] = useState<Step>("choose");
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [isLoading, setIsLoading] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const reset = useCallback(() => {
		setStep("choose");
		setEmail("");
		setOtp("");
		setIsLoading(null);
		setError(null);
	}, []);

	const handleOpenChange = useCallback(
		(value: boolean) => {
			if (!value) reset();
			onOpenChange(value);
		},
		[onOpenChange, reset]
	);

	const handleOAuthSignIn = async (provider: "google" | "github") => {
		setIsLoading(provider);
		setError(null);
		try {
			await signInWithOAuth(provider);
			handleOpenChange(false);
		} catch {
			setError(`Failed to sign in with ${provider}. Please try again.`);
		} finally {
			setIsLoading(null);
		}
	};

	const handleWalletConnect = useCallback(async () => {
		setError(null);
		if (!isWalletConnected) {
			setIsLoading("wallet");
			try {
				await wallet.select(wallet.wallets[0]?.adapter.name ?? null);
				await wallet.connect();
				setStep("wallet-verify");
			} catch {
				setError("Failed to connect wallet. Please try again.");
			} finally {
				setIsLoading(null);
			}
			return;
		}
		setStep("wallet-verify");
	}, [wallet, isWalletConnected]);

	const handleWalletVerify = useCallback(async () => {
		setIsLoading("wallet-verify");
		setError(null);
		try {
			await verifyWallet();
			handleOpenChange(false);
		} catch {
			setError("Wallet verification failed. Please try again.");
		} finally {
			setIsLoading(null);
		}
	}, [verifyWallet, handleOpenChange]);

	const handleEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;
		setIsLoading("email");
		setError(null);
		try {
			const res = await fetch("/api/auth/sign-in/email-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim() }),
			});
			if (!res.ok) throw new Error("Failed to send code");
			setStep("otp");
		} catch {
			setError("Failed to send verification code. Please try again.");
		} finally {
			setIsLoading(null);
		}
	};

	const handleOtpSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!otp.trim()) return;
		setIsLoading("otp");
		setError(null);
		try {
			const res = await fetch("/api/auth/sign-in/email-otp/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
			});
			if (!res.ok) throw new Error("Invalid code");
			handleOpenChange(false);
			window.location.reload();
		} catch {
			setError("Invalid or expired code. Please try again.");
		} finally {
			setIsLoading(null);
		}
	};

	const truncatedAddress = wallet.publicKey
		? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
		: null;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-xl">
						{step === "choose" && "Welcome to Superteam Academy"}
						{step === "email" && "Sign in with Email"}
						{step === "otp" && "Enter verification code"}
						{step === "wallet-verify" && "Verify your wallet"}
					</DialogTitle>
					<DialogDescription>
						{step === "choose" &&
							"Sign in to track your progress, earn XP, and unlock achievements."}
						{step === "email" && "We'll send a one-time code to your email."}
						{step === "otp" && `We sent a code to ${email}`}
						{step === "wallet-verify" &&
							`Sign a message to verify ownership of ${truncatedAddress}`}
					</DialogDescription>
				</DialogHeader>

				{error && (
					<div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
						{error}
					</div>
				)}

				{step === "choose" && (
					<div className="space-y-3 pt-2">
						<Button
							variant="outline"
							className="w-full justify-start h-11"
							onClick={handleWalletConnect}
							disabled={isLoading === "wallet"}
						>
							<Wallet className="w-4 h-4 mr-3" />
							{isLoading === "wallet"
								? "Connecting..."
								: isWalletConnected
									? `Continue with wallet (${truncatedAddress})`
									: "Continue with Solana Wallet"}
						</Button>

						<div className="relative my-4">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t border-border" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">or</span>
							</div>
						</div>

						<Button
							variant="outline"
							className="w-full justify-start h-11"
							onClick={() => handleOAuthSignIn("google")}
							disabled={isLoading === "google"}
						>
							<svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
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
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							{isLoading === "google" ? "Signing in..." : "Continue with Google"}
						</Button>

						<Button
							variant="outline"
							className="w-full justify-start h-11"
							onClick={() => handleOAuthSignIn("github")}
							disabled={isLoading === "github"}
						>
							<svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
							</svg>
							{isLoading === "github" ? "Signing in..." : "Continue with GitHub"}
						</Button>

						<Button
							variant="outline"
							className="w-full justify-start h-11"
							onClick={() => setStep("email")}
						>
							<Mail className="w-4 h-4 mr-3" />
							Continue with Email
						</Button>
					</div>
				)}

				{step === "wallet-verify" && (
					<div className="space-y-4 pt-2">
						<p className="text-sm text-muted-foreground">
							Your wallet will prompt you to sign a message. This proves ownership
							without any on-chain transaction or gas fees.
						</p>
						<Button
							className="w-full"
							onClick={handleWalletVerify}
							disabled={isLoading === "wallet-verify"}
						>
							{isLoading === "wallet-verify" ? "Signing..." : "Sign message & verify"}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-full"
							onClick={() => {
								setStep("choose");
								setError(null);
							}}
						>
							<ArrowLeft className="w-3.5 h-3.5 mr-2" />
							Back to sign in options
						</Button>
					</div>
				)}

				{step === "email" && (
					<form onSubmit={handleEmailSubmit} className="space-y-4 pt-2">
						<div className="space-y-2">
							<Label htmlFor="login-email">Email address</Label>
							<Input
								id="login-email"
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoFocus
								autoComplete="email"
							/>
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={isLoading === "email" || !email.trim()}
						>
							{isLoading === "email" ? "Sending code..." : "Send verification code"}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-full"
							onClick={() => {
								setStep("choose");
								setError(null);
							}}
						>
							<ArrowLeft className="w-3.5 h-3.5 mr-2" />
							Back to sign in options
						</Button>
					</form>
				)}

				{step === "otp" && (
					<form onSubmit={handleOtpSubmit} className="space-y-4 pt-2">
						<div className="space-y-2">
							<Label htmlFor="login-otp">Verification code</Label>
							<Input
								id="login-otp"
								type="text"
								inputMode="numeric"
								pattern="[0-9]*"
								placeholder="Enter 6-digit code"
								value={otp}
								onChange={(e) =>
									setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
								}
								required
								autoFocus
								autoComplete="one-time-code"
								maxLength={6}
							/>
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={isLoading === "otp" || otp.length < 6}
						>
							{isLoading === "otp" ? "Verifying..." : "Verify & Sign in"}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-full"
							onClick={() => {
								setStep("email");
								setOtp("");
								setError(null);
							}}
						>
							<ArrowLeft className="w-3.5 h-3.5 mr-2" />
							Use a different email
						</Button>
					</form>
				)}

				<p className="text-xs text-muted-foreground text-center pt-2">
					By continuing, you agree to our Terms of Service and Privacy Policy.
				</p>
			</DialogContent>
		</Dialog>
	);
}
