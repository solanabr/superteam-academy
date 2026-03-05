/**
 * @fileoverview LessonNavigation component for navigating between lessons.
 * Handles lesson completion tracking and course finalization logic.
 */

"use client";

import {
	CaretLeftIcon,
	CaretRightIcon,
	CheckCircleIcon,
	SidebarIcon,
} from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import { learningProgressService } from "@/lib/services/learning-progress";

/**
 * Props for the LessonNavigation component.
 */
interface LessonNavigationProps {
	courseSlug: string;
	lessonId: string;
	prevLessonId?: string;
	nextLessonId?: string;
	/** Determines button labeling (e.g. "Start Challenge") */
	nextLessonType?: "content" | "challenge";
	lessonIndex: number;
	isLastLesson: boolean;
	sidebarOpen?: boolean;
	onToggleSidebar?: () => void;
}

/**
 * Navigation controls for the lesson view.
 */
export function LessonNavigation({
	courseSlug,
	lessonId,
	prevLessonId,
	nextLessonId,
	nextLessonType = "content",
	lessonIndex,
	isLastLesson,
	sidebarOpen,
	onToggleSidebar,
}: LessonNavigationProps) {
	const t = useTranslations("Lesson");
	const router = useRouter();
	const wallet = useWallet();
	const queryClient = useQueryClient();
	const [isCompleting, setIsCompleting] = useState(false);

	const handleCompleteAndNext = async () => {
		if (!wallet.publicKey) {
			toast.error("Please connect your wallet to save progress.");
			return;
		}

		setIsCompleting(true);
		try {
			// 1. Complete the current lesson
			const completion = await learningProgressService.completeLesson({
				courseSlug,
				learnerAddress: wallet.publicKey.toBase58(),
				lessonIndex,
			});

			if (completion.error) throw new Error(completion.error);

			toast.success("Lesson Complete! Progress saved on-chain");

			// Invalidate queries to refresh progress
			queryClient.invalidateQueries({ queryKey: ["course", courseSlug] });

			// 2. If it was the last lesson, finalize the course
			if (isLastLesson) {
				toast.info("Course completion detected. Finalizing...");
				const finalization = await learningProgressService.finalizeCourse({
					courseSlug,
					learnerAddress: wallet.publicKey.toBase58(),
				});

				if (finalization.error) {
					toast.error(
						`Finalization failed: ${finalization.error}. You can retry from the dashboard.`,
					);
				} else {
					toast.success("Course Finalized! Bonus XP rewarded.");

					// 3. Issue Credential
					toast.info("Issuing your completion credential...");
					const credential = await learningProgressService.claimCredential({
						courseSlug,
						learnerAddress: wallet.publicKey.toBase58(),
					});

					if (credential.error) {
						toast.error(
							`Credential issuance failed: ${credential.error}. You can try again from the dashboard.`,
						);
					} else {
						toast.success("Credential Issued! Check your wallet for your NFT.");
					}
				}
			}

			posthog.capture("lesson_completed", {
				courseSlug,
				lessonId,
				lessonType: nextLessonType,
			});

			if (nextLessonId) {
				router.push(`/courses/${courseSlug}/lessons/${nextLessonId}`);
			} else {
				// Final lesson completed - redirect to course overview or dashboard
				toast.success(t("markCourseComplete"));
				router.push(`/courses/${courseSlug}`);
			}
		} catch (error) {
			console.error(error);
			toast.error("Failed to save progress");
		} finally {
			setIsCompleting(false);
		}
	};

	return (
		<div className="flex gap-4 items-center w-full">
			{onToggleSidebar && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleSidebar}
					className="text-ink-secondary hover:text-ink-primary p-2 h-auto"
					title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
				>
					<SidebarIcon size={20} weight={sidebarOpen ? "fill" : "regular"} />
				</Button>
			)}

			<div className="h-4 w-px bg-ink-secondary/20 mx-2 hidden lg:block" />

			<div className="flex gap-4 flex-1">
				{prevLessonId ? (
					<Link href={`/courses/${courseSlug}/lessons/${prevLessonId}`}>
						<Button
							variant="outline"
							className="rounded-none uppercase text-[10px] font-bold px-4 py-2 h-auto tracking-widest flex items-center gap-2 border-ink-secondary/20 dark:border-border"
						>
							<CaretLeftIcon size={12} weight="bold" /> {t("previous")}
						</Button>
					</Link>
				) : (
					<Button
						variant="outline"
						disabled
						className="rounded-none uppercase text-[10px] font-bold px-4 py-2 h-auto tracking-widest flex items-center gap-2 opacity-50 cursor-not-allowed border-ink-secondary/20 dark:border-border"
					>
						<CaretLeftIcon size={12} weight="bold" /> {t("previous")}
					</Button>
				)}

				{nextLessonId ? (
					<Button
						variant="landingPrimary"
						className="rounded-none uppercase text-[10px] font-bold px-4 py-2 h-auto tracking-widest flex items-center gap-2 border border-ink-secondary/20 dark:border-border"
						onClick={handleCompleteAndNext}
						disabled={isCompleting}
					>
						{isCompleting ? (
							t("savingProgress")
						) : nextLessonType === "challenge" ? (
							<>
								{t("startChallenge")} <CaretRightIcon size={12} weight="bold" />
							</>
						) : (
							<>
								Complete & {t("nextLesson")}{" "}
								<CheckCircleIcon size={12} weight="bold" />
							</>
						)}
					</Button>
				) : (
					<Button
						variant="landingPrimary"
						onClick={handleCompleteAndNext}
						disabled={isCompleting}
						className="rounded-none uppercase text-[10px] font-bold px-4 py-2 h-auto tracking-widest flex items-center gap-2 border border-ink-secondary/20 dark:border-border"
					>
						{isCompleting ? (
							"Saving Progress..."
						) : (
							<>
								Mark Course Complete <CheckCircleIcon size={12} weight="bold" />
							</>
						)}
					</Button>
				)}
			</div>
		</div>
	);
}
