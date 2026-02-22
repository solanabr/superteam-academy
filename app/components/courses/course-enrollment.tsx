"use client";

import { useState } from "react";
import { Wallet, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { buildEnrollInstruction, buildCloseEnrollmentInstruction } from "@superteam/anchor";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { getProgramId } from "@/lib/academy";

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
	const { wallet } = useAuth();
	const { connection } = useConnection();
	const [enrollmentMethod, setEnrollmentMethod] = useState<"wallet" | "card" | null>(null);
	const [isEnrolling, setIsEnrolling] = useState(false);
	const [isClosing, setIsClosing] = useState(false);

	const prerequisitesMet = course.prerequisites
		? course.prerequisites.every((p) => p.completed)
		: true;

	const handleEnrollment = async () => {
		if (!prerequisitesMet) return;
		if (!wallet.publicKey || !wallet.sendTransaction) return;

		setIsEnrolling(true);
		try {
			const ix = buildEnrollInstruction({
				courseId: course.id,
				learner: wallet.publicKey,
				programId: getProgramId(),
				prerequisiteCourseId: course.prerequisiteCourseId,
			});

			const tx = new Transaction().add(ix);
			tx.feePayer = wallet.publicKey;
			tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

			const signature = await wallet.sendTransaction(tx, connection);
			await connection.confirmTransaction(signature, "confirmed");
		} finally {
			setIsEnrolling(false);
		}
	};

	const handleCloseEnrollment = async () => {
		if (!wallet.publicKey || !wallet.sendTransaction) return;

		setIsClosing(true);
		try {
			const ix = buildCloseEnrollmentInstruction({
				courseId: course.id,
				learner: wallet.publicKey,
				programId: getProgramId(),
			});

			const tx = new Transaction().add(ix);
			tx.feePayer = wallet.publicKey;
			tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

			const signature = await wallet.sendTransaction(tx, connection);
			await connection.confirmTransaction(signature, "confirmed");
		} finally {
			setIsClosing(false);
		}
	};

	if (course.enrolled) {
		return (
			<div className="space-y-4">
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

				<Button className="w-full" size="lg">
					{t("enroll.continueLearning")}
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className="w-full text-muted-foreground"
					onClick={handleCloseEnrollment}
					disabled={isClosing}
				>
					{isClosing ? t("enroll.processing") : t("enroll.closeEnrollment")}
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
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
						disabled={!prerequisitesMet || isEnrolling}
					>
						{isEnrolling ? t("enroll.enrolling") : t("enroll.enrollFree")}
					</Button>
				</div>
			) : (
				<div className="space-y-4">
					<div className="text-center p-6 bg-muted/50 rounded-lg">
						<div className="text-3xl font-bold mb-2">${course.price}</div>
						<p className="text-muted-foreground">{t("enroll.oneTimePayment")}</p>
					</div>

					<div className="space-y-3">
						<div className="text-sm font-medium">{t("enroll.choosePayment")}</div>

						<div className="space-y-2">
							<Card
								className={`cursor-pointer transition-colors ${
									enrollmentMethod === "wallet"
										? "border-primary bg-primary/5"
										: ""
								}`}
								onClick={() => setEnrollmentMethod("wallet")}
							>
								<CardContent className="p-4">
									<div className="flex items-center gap-3">
										<Wallet className="h-5 w-5" />
										<div className="flex-1">
											<div className="font-medium">
												{t("enroll.cryptoWallet")}
											</div>
											<div className="text-sm text-muted-foreground">
												{t("enroll.payWithCrypto")}
											</div>
										</div>
										<Badge variant="secondary">{t("enroll.recommended")}</Badge>
									</div>
								</CardContent>
							</Card>

							<Card
								className={`cursor-pointer transition-colors ${
									enrollmentMethod === "card" ? "border-primary bg-primary/5" : ""
								}`}
								onClick={() => setEnrollmentMethod("card")}
							>
								<CardContent className="p-4">
									<div className="flex items-center gap-3">
										<CreditCard className="h-5 w-5" />
										<div className="flex-1">
											<div className="font-medium">
												{t("enroll.creditCard")}
											</div>
											<div className="text-sm text-muted-foreground">
												{t("enroll.creditCardDesc")}
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>

					<Button
						className="w-full"
						size="lg"
						onClick={handleEnrollment}
						disabled={!prerequisitesMet || !enrollmentMethod || isEnrolling}
					>
						{isEnrolling
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
		</div>
	);
}
