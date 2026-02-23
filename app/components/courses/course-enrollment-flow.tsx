"use client";

import { useState } from "react";
import { BookOpen, Check, AlertCircle, CreditCard, Clock, Users } from "lucide-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { buildEnrollInstruction } from "@superteam/anchor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { getProgramId } from "@/lib/academy";

interface Course {
	id: string;
	title: string;
	description: string;
	duration: string;
	level: "beginner" | "intermediate" | "advanced";
	enrolled: number;
	capacity: number;
	price: number;
	currency: string;
	prerequisites?: string[];
	prerequisiteCourseId?: string;
}

interface CourseEnrollmentFlowProps {
	course: Course;
	onSuccess?: (courseId: string) => void;
	onCancel?: () => void;
}

type EnrollmentStep = "overview" | "prerequisites" | "payment" | "confirm" | "success";

export function CourseEnrollmentFlow({ course, onSuccess, onCancel }: CourseEnrollmentFlowProps) {
	const t = useTranslations("enrollment");
	const { toast } = useToast();
	const { wallet } = useAuth();
	const { connection } = useConnection();
	const [currentStep, setCurrentStep] = useState<EnrollmentStep>("overview");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleEnroll = async () => {
		if (!wallet.publicKey || !wallet.sendTransaction) {
			setError(t("walletNotConnected"));
			return;
		}

		try {
			setIsLoading(true);
			setError(null);

			const ix = buildEnrollInstruction({
				courseId: course.id,
				learner: wallet.publicKey,
				programId: getProgramId(),
				...(course.prerequisiteCourseId
					? { prerequisiteCourseId: course.prerequisiteCourseId }
					: {}),
			});

			const tx = new Transaction().add(ix);
			tx.feePayer = wallet.publicKey;
			tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

			const signature = await wallet.sendTransaction(tx, connection);
			await connection.confirmTransaction(signature, "confirmed");

			setCurrentStep("success");
			toast({
				title: t("enrolled"),
				description: t("enrolledDesc", { course: course.title }),
			});

			onSuccess?.(course.id);
		} catch (_err) {
			setError(t("enrollmentFailed"));
			toast({
				title: t("enrollmentFailed"),
				description: t("enrollmentFailedDesc"),
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const getLevelColor = (level: string) => {
		switch (level) {
			case "beginner":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
			case "intermediate":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
			case "advanced":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
		}
	};

	const renderStep = () => {
		switch (currentStep) {
			case "overview":
				return (
					<div className="space-y-6">
						<div className="text-center space-y-2">
							<h2 className="text-xl font-semibold">{course.title}</h2>
							<p className="text-muted-foreground">{course.description}</p>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">{course.duration}</span>
							</div>
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">
									{course.enrolled}/{course.capacity} {t("enrolled")}
								</span>
							</div>
						</div>

						<div className="flex items-center justify-center">
							<Badge className={getLevelColor(course.level)}>{t(course.level)}</Badge>
						</div>

						<div className="text-center">
							<div className="text-2xl font-bold">
								{course.price === 0
									? t("free")
									: `${course.currency} ${course.price}`}
							</div>
							{course.price > 0 && (
								<p className="text-sm text-muted-foreground">
									{t("oneTimePayment")}
								</p>
							)}
						</div>

						<div className="flex gap-3">
							<Button variant="outline" onClick={onCancel} className="flex-1">
								{t("cancel")}
							</Button>
							<Button
								onClick={() => setCurrentStep("prerequisites")}
								className="flex-1"
							>
								{t("continue")}
							</Button>
						</div>
					</div>
				);

			case "prerequisites":
				return (
					<div className="space-y-6">
						<div className="text-center space-y-2">
							<h2 className="text-xl font-semibold">{t("prerequisites")}</h2>
							<p className="text-muted-foreground">{t("prerequisitesDesc")}</p>
						</div>

						{course.prerequisites && course.prerequisites.length > 0 ? (
							<div className="space-y-3">
								{course.prerequisites.map((prereq, index) => (
									<div
										key={index}
										className="flex items-start gap-3 p-3 border rounded-lg"
									>
										<Check className="h-4 w-4 text-green-600 mt-0.5" />
										<span className="text-sm">{prereq}</span>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8">
								<Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
								<p className="text-muted-foreground">{t("noPrerequisites")}</p>
							</div>
						)}

						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() => setCurrentStep("overview")}
								className="flex-1"
							>
								{t("back")}
							</Button>
							<Button
								onClick={() =>
									course.price === 0 ? handleEnroll() : setCurrentStep("payment")
								}
								className="flex-1"
							>
								{course.price === 0 ? t("enrollNow") : t("continue")}
							</Button>
						</div>
					</div>
				);

			case "payment":
				return (
					<div className="space-y-6">
						<div className="text-center space-y-2">
							<h2 className="text-xl font-semibold">{t("payment")}</h2>
							<p className="text-muted-foreground">{t("paymentDesc")}</p>
						</div>

						<Card>
							<CardContent className="pt-6">
								<div className="text-center space-y-4">
									<CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
									<div>
										<div className="text-2xl font-bold">
											{course.currency} {course.price}
										</div>
										<p className="text-sm text-muted-foreground">
											{t("oneTimePayment")}
										</p>
									</div>
									<Button
										onClick={() => setCurrentStep("confirm")}
										className="w-full"
									>
										<CreditCard className="h-4 w-4 mr-2" />
										{t("payNow")}
									</Button>
								</div>
							</CardContent>
						</Card>

						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() => setCurrentStep("prerequisites")}
								className="flex-1"
							>
								{t("back")}
							</Button>
						</div>
					</div>
				);

			case "confirm":
				return (
					<div className="space-y-6">
						<div className="text-center space-y-2">
							<h2 className="text-xl font-semibold">{t("confirmEnrollment")}</h2>
							<p className="text-muted-foreground">{t("confirmDesc")}</p>
						</div>

						<Card>
							<CardContent className="pt-6">
								<div className="space-y-4">
									<div className="flex justify-between">
										<span>{t("course")}:</span>
										<span className="font-medium">{course.title}</span>
									</div>
									<div className="flex justify-between">
										<span>{t("duration")}:</span>
										<span>{course.duration}</span>
									</div>
									<div className="flex justify-between">
										<span>{t("level")}:</span>
										<Badge className={getLevelColor(course.level)}>
											{t(course.level)}
										</Badge>
									</div>
									<div className="flex justify-between font-bold">
										<span>{t("total")}:</span>
										<span>
											{course.currency} {course.price}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() => setCurrentStep("payment")}
								className="flex-1"
							>
								{t("back")}
							</Button>
							<Button onClick={handleEnroll} disabled={isLoading} className="flex-1">
								{isLoading ? t("enrolling") : t("confirmEnroll")}
							</Button>
						</div>
					</div>
				);

			case "success":
				return (
					<div className="text-center space-y-6">
						<div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
							<Check className="h-8 w-8 text-green-600" />
						</div>
						<div className="space-y-2">
							<h2 className="text-xl font-semibold">{t("enrollmentSuccess")}</h2>
							<p className="text-muted-foreground">
								{t("enrollmentSuccessDesc", { course: course.title })}
							</p>
						</div>

						<div className="space-y-4">
							<div className="p-4 bg-muted rounded-lg">
								<h3 className="font-medium mb-2">{t("nextSteps")}</h3>
								<ul className="text-sm text-muted-foreground space-y-1">
									<li>• {t("nextStep1")}</li>
									<li>• {t("nextStep2")}</li>
									<li>• {t("nextStep3")}</li>
								</ul>
							</div>

							<Button onClick={() => onSuccess?.(course.id)} className="w-full">
								<BookOpen className="h-4 w-4 mr-2" />
								{t("startLearning")}
							</Button>
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	const getStepProgress = () => {
		const steps = ["overview", "prerequisites", "payment", "confirm", "success"];
		const currentIndex = steps.indexOf(currentStep);
		return ((currentIndex + 1) / steps.length) * 100;
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BookOpen className="h-5 w-5" />
					{t("courseEnrollment")}
				</CardTitle>
				{currentStep !== "success" && (
					<Progress value={getStepProgress()} className="mt-2" />
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
