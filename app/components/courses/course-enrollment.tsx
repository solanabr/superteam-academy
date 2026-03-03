"use client";

import { useState } from "react";
import { Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { type PublicKey, Transaction } from "@solana/web3.js";
import { buildEnrollInstruction, buildCloseEnrollmentInstruction } from "@superteam-academy/anchor";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/contexts/auth-context";
import { getProgramId } from "@/lib/academy";
import { useRouter } from "@superteam-academy/i18n/navigation";
import { useOnchainEnrollment } from "@/hooks/use-onchain-enrollment";

interface CourseEnrollmentProps {
	course: {
		id: string;
		title: string;
		price: number;
		enrolled?: boolean;
		prerequisiteCourseId?: string;
		prerequisites?: Array<{
			id: string;
			title: string;
			completed: boolean;
		}>;
	};
}

export function CourseEnrollment({ course }: CourseEnrollmentProps) {
	const t = useTranslations("courses");
	const { wallet, isWalletConnected, isWalletVerified, isAuthenticated, verifyWallet } =
		useAuth();
	const { enrolled, refetch } = useOnchainEnrollment(course.id, course.enrolled);
	const { connection } = useConnection();
	const router = useRouter();
	const [loginOpen, setLoginOpen] = useState(false);
	const [isEnrolling, setIsEnrolling] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [authError, setAuthError] = useState<string | null>(null);

	const prerequisitesMet = course.prerequisites
		? course.prerequisites.every((p) => p.completed)
		: true;
	const canClose = isWalletVerified && wallet.publicKey && wallet.sendTransaction;

	const handleEnrollment = async () => {
		if (!prerequisitesMet) return;

		if (!isWalletConnected) {
			if (!isAuthenticated) {
				setLoginOpen(true);
				return;
			}
			setAuthError(t("enroll.walletRequired"));
			return;
		}

		if (!isWalletVerified) {
			setIsVerifying(true);
			setAuthError(null);
			try {
				await verifyWallet();
			} catch (error) {
				console.error("Wallet verification failed", error);
				setAuthError(t("enroll.verificationFailed"));
				setIsVerifying(false);
				return;
			}
			setIsVerifying(false);
		}

		// Step 3: Send enrollment transaction
		if (!wallet.publicKey || !wallet.sendTransaction) return;

		setIsEnrolling(true);
		setAuthError(null);
		try {
			const ix = buildEnrollInstruction({
				courseId: course.id,
				learner: wallet.publicKey as PublicKey,
				programId: getProgramId(),
				...(course.prerequisiteCourseId
					? { prerequisiteCourseId: course.prerequisiteCourseId }
					: {}),
			});

			const tx = new Transaction().add(ix);
			tx.feePayer = wallet.publicKey as PublicKey;
			const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
			tx.recentBlockhash = blockhash;

			const signature = await wallet.sendTransaction(tx, connection);
			await connection.confirmTransaction(
				{ signature, blockhash, lastValidBlockHeight },
				"confirmed"
			);

			refetch();
			router.push(`/courses/${course.id}/lessons/1-1`);
		} catch (error) {
			console.error("Enrollment failed:", error);
			const message = error instanceof Error ? error.message : t("enroll.enrollmentFailed");
			setAuthError(message);
		} finally {
			setIsEnrolling(false);
		}
	};

	const handleCloseEnrollment = async () => {
		if (!wallet.publicKey || !wallet.sendTransaction) return;
		if (!isWalletVerified) {
			setAuthError(t("enroll.verifyWalletPrompt"));
			return;
		}

		setIsClosing(true);
		setAuthError(null);
		try {
			const ix = buildCloseEnrollmentInstruction({
				courseId: course.id,
				learner: wallet.publicKey as PublicKey,
				programId: getProgramId(),
			});

			const tx = new Transaction().add(ix);
			tx.feePayer = wallet.publicKey as PublicKey;
			const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
			tx.recentBlockhash = blockhash;

			const signature = await wallet.sendTransaction(tx, connection);
			await connection.confirmTransaction(
				{ signature, blockhash, lastValidBlockHeight },
				"confirmed"
			);

			router.push("/courses");
		} catch (error) {
			console.error("Failed to close enrollment:", error);
			const message =
				error instanceof Error ? error.message : t("enroll.closeEnrollmentFailed");
			setAuthError(message);
		} finally {
			setIsClosing(false);
		}
	};

	if (enrolled) {
		return (
			<div className="space-y-4">
				{authError && (
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{authError}</AlertDescription>
					</Alert>
				)}
				<div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
					<div className="flex items-center gap-3">
						<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
						<div>
							<h3 className="font-medium text-green-800 dark:text-green-200">
								{t("enroll.enrolled")}
							</h3>
							<p className="text-sm text-green-700 dark:text-green-300">
								{t("enroll.hasAccess")}
							</p>
						</div>
					</div>
				</div>

				<Button className="w-full" size="lg" asChild={true}>
					<a href={`/courses/${course.id}/lessons/1-1`}>{t("enroll.continueLearning")}</a>
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className="w-full text-muted-foreground"
					onClick={handleCloseEnrollment}
					disabled={!canClose || isClosing}
				>
					{isClosing ? t("enroll.processing") : t("enroll.closeEnrollment")}
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{authError && (
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{authError}</AlertDescription>
				</Alert>
			)}

			{!prerequisitesMet && (
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{t("enroll.completePrerequisites")}</AlertDescription>
				</Alert>
			)}

			{course.price === 0 ? (
				<div className="space-y-4">
					<div className="text-center p-6 bg-muted/50 rounded-lg">
						<div className="text-3xl font-bold text-green-600 mb-2">
							{t("enroll.free")}
						</div>
						<p className="text-muted-foreground">{t("enroll.noPayment")}</p>
					</div>

					<Button
						className="w-full"
						size="lg"
						onClick={handleEnrollment}
						disabled={!prerequisitesMet || isEnrolling || isVerifying}
					>
						{isEnrolling
							? t("enroll.enrolling")
							: isVerifying
								? t("enroll.processing")
								: t("enroll.enrollFree")}
					</Button>
				</div>
			) : (
				<div className="space-y-4">
					<div className="text-center p-6 bg-muted/50 rounded-lg">
						<div className="text-3xl font-bold mb-2">${course.price}</div>
						<p className="text-muted-foreground">{t("enroll.oneTimePayment")}</p>
					</div>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<Wallet className="h-5 w-5" />
								<div className="flex-1">
									<div className="font-medium">{t("enroll.cryptoWallet")}</div>
									<div className="text-sm text-muted-foreground">
										{t("enroll.payWithCrypto")}
									</div>
								</div>
								<Badge variant="secondary">{t("enroll.recommended")}</Badge>
							</div>
						</CardContent>
					</Card>

					<Button
						className="w-full"
						size="lg"
						onClick={handleEnrollment}
						disabled={!prerequisitesMet || isEnrolling || isVerifying}
					>
						{isEnrolling
							? t("enroll.processing")
							: isVerifying
								? t("enroll.processing")
								: t("enroll.enrollFor", { price: course.price })}
					</Button>
				</div>
			)}

			<div className="text-xs text-muted-foreground text-center space-y-1">
				<p>{t("enroll.moneyBack")}</p>
				<p>{t("enroll.lifetimeAccess")}</p>
				<p>{t("enroll.certificateIncluded")}</p>
			</div>

			<LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
		</div>
	);
}
