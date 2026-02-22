"use client";

import { useState } from "react";
import { Mail, Key, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

type RecoveryStep = "email" | "code" | "reset" | "success";

interface AccountRecoveryFlowProps {
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function AccountRecoveryFlow({ onSuccess, onCancel }: AccountRecoveryFlowProps) {
	const t = useTranslations("recovery");
	const { toast } = useToast();
	const [currentStep, setCurrentStep] = useState<RecoveryStep>("email");
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSendCode = async () => {
		if (!email.trim()) {
			setError(t("emailRequired"));
			return;
		}

		if (!/\S+@\S+\.\S+/.test(email)) {
			setError(t("invalidEmail"));
			return;
		}

		try {
			setIsLoading(true);
			setError(null);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 2000));

			setCurrentStep("code");
			toast({
				title: t("codeSent"),
				description: t("codeSentDesc"),
			});
		} catch (_err) {
			setError(t("sendCodeFailed"));
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyCode = async () => {
		if (!code.trim() || code.length !== 6) {
			setError(t("invalidCode"));
			return;
		}

		try {
			setIsLoading(true);
			setError(null);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			setCurrentStep("reset");
			toast({
				title: t("codeVerified"),
				description: t("codeVerifiedDesc"),
			});
		} catch (_err) {
			setError(t("verifyCodeFailed"));
		} finally {
			setIsLoading(false);
		}
	};

	const handleResetPassword = async () => {
		if (!newPassword.trim()) {
			setError(t("passwordRequired"));
			return;
		}

		if (newPassword.length < 8) {
			setError(t("passwordTooShort"));
			return;
		}

		if (newPassword !== confirmPassword) {
			setError(t("passwordMismatch"));
			return;
		}

		try {
			setIsLoading(true);
			setError(null);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 2000));

			setCurrentStep("success");
			toast({
				title: t("passwordReset"),
				description: t("passwordResetDesc"),
			});

			// Auto redirect after success
			setTimeout(() => {
				onSuccess?.();
			}, 3000);
		} catch (_err) {
			setError(t("resetFailed"));
		} finally {
			setIsLoading(false);
		}
	};

	const handleBack = () => {
		if (currentStep === "code") {
			setCurrentStep("email");
		} else if (currentStep === "reset") {
			setCurrentStep("code");
		} else {
			onCancel?.();
		}
	};

	const renderStep = () => {
		switch (currentStep) {
			case "email":
				return (
					<div className="space-y-4">
						<div className="text-center space-y-2">
							<h2 className="text-xl font-semibold">{t("forgotPassword")}</h2>
							<p className="text-muted-foreground">{t("enterEmailDesc")}</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">{t("email")}</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder={t("emailPlaceholder")}
								disabled={isLoading}
							/>
						</div>

						<Button onClick={handleSendCode} disabled={isLoading} className="w-full">
							<Mail className="h-4 w-4 mr-2" />
							{isLoading ? t("sending") : t("sendCode")}
						</Button>
					</div>
				);

			case "code":
				return (
					<div className="space-y-4">
						<div className="text-center space-y-2">
							<h2 className="text-xl font-semibold">{t("enterCode")}</h2>
							<p className="text-muted-foreground">{t("codeSentTo", { email })}</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="code">{t("verificationCode")}</Label>
							<Input
								id="code"
								value={code}
								onChange={(e) =>
									setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
								}
								placeholder="000000"
								maxLength={6}
								disabled={isLoading}
								className="text-center text-lg tracking-widest"
							/>
							<p className="text-xs text-muted-foreground text-center">
								{t("codeHelp")}
							</p>
						</div>

						<Button
							onClick={handleVerifyCode}
							disabled={isLoading || code.length !== 6}
							className="w-full"
						>
							<Key className="h-4 w-4 mr-2" />
							{isLoading ? t("verifying") : t("verifyCode")}
						</Button>

						<Button
							variant="ghost"
							onClick={handleSendCode}
							disabled={isLoading}
							className="w-full"
						>
							{t("resendCode")}
						</Button>
					</div>
				);

			case "reset":
				return (
					<div className="space-y-4">
						<div className="text-center space-y-2">
							<h2 className="text-xl font-semibold">{t("newPassword")}</h2>
							<p className="text-muted-foreground">{t("newPasswordDesc")}</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="newPassword">{t("newPassword")}</Label>
							<Input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder={t("passwordPlaceholder")}
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder={t("confirmPasswordPlaceholder")}
								disabled={isLoading}
							/>
						</div>

						<Button
							onClick={handleResetPassword}
							disabled={isLoading || !newPassword || !confirmPassword}
							className="w-full"
						>
							<Check className="h-4 w-4 mr-2" />
							{isLoading ? t("resetting") : t("resetPassword")}
						</Button>
					</div>
				);

			case "success":
				return (
					<div className="text-center space-y-4">
						<div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
							<Check className="h-6 w-6 text-green-600" />
						</div>
						<div className="space-y-2">
							<h2 className="text-xl font-semibold">{t("success")}</h2>
							<p className="text-muted-foreground">{t("successDesc")}</p>
						</div>
						<Button onClick={onSuccess} className="w-full">
							{t("continue")}
						</Button>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Key className="h-5 w-5" />
					{t("accountRecovery")}
				</CardTitle>
				{currentStep !== "success" && (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleBack}
						className="absolute right-4 top-4"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
				)}
			</CardHeader>
			<CardContent>
				{error && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{renderStep()}
			</CardContent>
		</Card>
	);
}
