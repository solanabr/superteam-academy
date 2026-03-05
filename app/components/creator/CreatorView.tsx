/**
 * @fileoverview Main creator console view.
 * Allows instructors to manage courses, initialize the platform, and publish content.
 */
"use client";

import {
	ChalkboardTeacherIcon,
	EyeIcon,
	GearIcon,
	GridFourIcon,
	ListIcon,
	PencilSimpleIcon,
	PlusIcon,
	RocketLaunchIcon,
} from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { DotGrid } from "@/components/shared/DotGrid";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { getProgram } from "@/lib/anchor/client";
import { checkCourseOnChainStatus } from "@/lib/services/course-publisher";
import { cn } from "@/lib/utils";
import { client } from "@/sanity/client";

interface Course {
	_id: string;
	title: string;
	slug: string;
	description: string;
	imageUrl?: string;
	difficulty: number;
	moduleCount: number;
	status?: string;
	onChainStatus?: string;
	coursePda?: string;
	creatorWallet?: string;
	onChain?: {
		isPublished: boolean;
		enrollments?: number;
		isActive?: boolean;
	};
}

export function CreatorView() {
	const wallet = useWallet();
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(true);
	const [publishing, setPublishing] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	// Fetch courses from Sanity and check initialization
	useEffect(() => {
		async function initCheck() {
			// Platform initialization check moved to AdminView
		}

		async function fetchCourses() {
			try {
				const data = await client.fetch(`
          *[_type == "course"] | order(_createdAt desc) {
            _id,
            title,
            "slug": slug.current,
            description,
            "imageUrl": image.asset->url,
            difficulty,
            status,
            track_id,
            track_level,
            xp_per_lesson,
            onChainStatus,
            coursePda,
            creatorWallet,
            "moduleCount": count(modules)
          }
        `);

				// Check on-chain status for each course
				if (wallet.publicKey) {
					const program = getProgram(wallet);
					if (program) {
						const coursesWithStatus = await Promise.all(
							data.map(async (course: Course) => {
								const onChainStatus = await checkCourseOnChainStatus(
									program,
									course.slug,
								);
								return { ...course, onChain: onChainStatus };
							}),
						);
						setCourses(coursesWithStatus);
					} else {
						setCourses(data);
					}
				} else {
					setCourses(data);
				}
			} catch (error) {
				console.error("Error fetching courses:", error);
				toast.error("Failed to load courses");
			} finally {
				setLoading(false);
			}
		}

		initCheck().then(fetchCourses);
	}, [wallet.publicKey, wallet]);

	// Submit course for review
	async function handleSubmitForReview(course: Course) {
		if (!wallet.publicKey) {
			toast.error("Please connect your wallet first");
			return;
		}

		setPublishing(course._id);
		toast.info("Submitting course for review...");

		try {
			const response = await fetch("/api/course/submit-review", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					courseId: course._id,
					creatorWallet: wallet.publicKey.toString(),
				}),
			});

			if (response.ok) {
				toast.success("Course submitted for review!");
				// Refresh local status
				const updatedCourses = courses.map((c) =>
					c._id === course._id ? { ...c, status: "review_pending" } : c,
				);
				setCourses(updatedCourses);
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || "Failed to submit course");
			}
		} catch (error) {
			console.error("Error submitting course:", error);
			toast.error("Failed to submit course");
		} finally {
			setPublishing(null);
		}
	}

	return (
		<div className="min-h-screen bg-bg-base">
			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full">
				<div className="col-span-1 lg:col-span-2">
					<TopBar />
				</div>

				<NavRail />

				<div className="overflow-visible lg:overflow-hidden relative">
					<DotGrid />
					<main className="px-4 py-6 lg:px-8 lg:py-8 overflow-visible lg:overflow-y-auto relative z-10 h-full">
						{/* Header */}
						<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 lg:mb-12">
							<div className="mb-6 border-b border-ink-secondary/20 dark:border-border pb-4 relative w-full md:w-auto flex-1">
								<span className="bg-[#14F195] text-ink-primary dark:text-bg-base px-3 py-1 text-[10px] uppercase tracking-widest inline-block mb-3 font-bold">
									INSTRUCTOR CONSOLE
								</span>
								<h1 className="font-display font-bold leading-none -tracking-[0.02em] text-[36px] lg:text-[48px] text-ink-primary">
									CONTENT STUDIO
								</h1>
								<p className="text-ink-secondary mt-3 max-w-xl text-sm mb-4">
									Create courses, build challenges, and publish content to the
									blockchain.
								</p>
								<div className="flex items-start sm:items-center gap-2 text-xs text-ink-secondary">
									<span className="bg-[#FFB020]/20 dark:bg-[#FFB020]/10 text-[#bd7500] dark:text-[#FFB020] px-2 py-0.5 font-bold uppercase tracking-widest text-[9px]">
										NOTICE
									</span>
									<span>
										To publish a course on-chain, your wallet must hold the{" "}
										<strong className="text-ink-primary font-bold">
											CREATOR
										</strong>{" "}
										Role NFT.
									</span>
								</div>
								<div className="absolute bottom-[-3px] right-0 w-full h-px border-b border-dashed border-ink-secondary/10 dark:border-border" />
							</div>

							<Button
								className="bg-ink-primary hover:bg-ink-primary/90 text-bg-base font-bold uppercase tracking-widest rounded-none flex items-center gap-2 mb-6"
								asChild
							>
								<Link href="/creator/studio">
									<PlusIcon weight="bold" />
									New Course
								</Link>
							</Button>
						</div>

						{!wallet.publicKey ? (
							<div className="border border-border bg-surface/50 p-12 text-center rounded-sm">
								<h2 className="font-display text-2xl mb-4">CONNECT WALLET</h2>
								<p className="text-ink-secondary mb-6">
									Connect your wallet to access the Creator Studio and manage
									on-chain courses.
								</p>
							</div>
						) : (
							<div className="flex flex-col gap-8">
								{/* Main Content Area */}
								<div className="flex flex-col gap-6">
									<div className="flex items-center justify-between mb-2">
										<h2 className="font-display text-xl uppercase tracking-widest text-ink-primary flex items-center gap-2">
											<ChalkboardTeacherIcon
												weight="duotone"
												className="w-6 h-6"
											/>{" "}
											My Courses
										</h2>
										<div className="flex gap-2 border border-ink-secondary/10 bg-white/20 dark:bg-surface p-1">
											<button
												onClick={() => setViewMode("grid")}
												className={cn(
													"p-1.5 transition-colors",
													viewMode === "grid"
														? "bg-ink-primary text-[#14F195]"
														: "text-ink-secondary hover:text-ink-primary",
												)}
											>
												<GridFourIcon className="w-4 h-4" />
											</button>
											<button
												onClick={() => setViewMode("list")}
												className={cn(
													"p-1.5 transition-colors",
													viewMode === "list"
														? "bg-ink-primary text-[#14F195]"
														: "text-ink-secondary hover:text-ink-primary",
												)}
											>
												<ListIcon className="w-4 h-4" />
											</button>
										</div>
									</div>

									<div
										className={cn(
											viewMode === "grid"
												? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
												: "flex flex-col gap-4",
										)}
									>
										{loading ? (
											<div className="text-center py-8 text-ink-secondary col-span-full">
												Loading courses...
											</div>
										) : courses.length === 0 ? (
											<div className="border border-border bg-surface/50 p-8 text-center col-span-full">
												<p className="text-ink-secondary mb-4">
													No courses yet. Create your first course in Sanity
													Studio.
												</p>
												<Button
													className="bg-ink-primary hover:bg-ink-primary/90 text-bg-base font-bold uppercase tracking-widest rounded-none"
													asChild
												>
													<Link href="/creator/studio">
														<PlusIcon weight="bold" className="mr-2" />
														Create Course
													</Link>
												</Button>
											</div>
										) : (
											courses.map((course) => {
												const isPublished =
													course.onChain?.isPublished ||
													course.status === "published" ||
													course.onChainStatus === "published";
												const isPending =
													!isPublished &&
													(course.status === "review_pending" ||
														course.status === "in_review");
												const isDraft = !isPublished && !isPending;
												const isPublishing = publishing === course._id;

												return viewMode === "list" ? (
													<div
														key={course._id}
														className="border border-ink-secondary/15 bg-bg-surface relative p-5 transition-all group hover:border-ink-primary hover:shadow-[6px_6px_0_rgba(13,20,18,0.08)] dark:hover:shadow-[4px_4px_0_var(--color-border)] hover:translate-x-[-2px] hover:translate-y-[-2px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
													>
														{/* Corner accents */}
														<div className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-ink-primary" />
														<div className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-ink-primary" />

														{/* Thumbnail */}
														<div className="w-[120px] h-[80px] shrink-0 border border-ink-secondary/10 bg-ink-secondary/2 dark:bg-ink-secondary/5 relative overflow-hidden hidden sm:flex items-center justify-center">
															{course.imageUrl ? (
																<Image
																	src={course.imageUrl}
																	alt={course.title}
																	fill
																	className="object-cover opacity-80"
																	sizes="120px"
																/>
															) : (
																<div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,var(--color-line-grid)_10px,var(--color-line-grid)_20px)]" />
															)}
														</div>

														<div className="flex-1">
															<div className="flex items-center gap-3 mb-1">
																<h3 className="font-bold text-lg">
																	{course.title}
																</h3>
																<span
																	className={cn(
																		"text-[10px] uppercase tracking-widest px-2 py-0.5",
																		isPublished
																			? "bg-[#14F195]/10 text-[#14F195]"
																			: isPending
																				? "bg-[#9945FF]/10 text-[#9945FF]"
																				: "bg-[#FFB020]/10 text-[#FFB020]",
																	)}
																>
																	{isPublished
																		? "PUBLISHED"
																		: isPending
																			? "IN REVIEW"
																			: "DRAFT"}
																</span>
															</div>
															<div className="flex items-center gap-4 text-xs text-ink-secondary">
																<span>{course.moduleCount || 0} Modules</span>
																{isPublished && (
																	<>
																		<span className="w-1 h-1 bg-border rounded-full" />
																		<span>
																			{course.onChain?.enrollments || 0}{" "}
																			Enrolled
																		</span>
																	</>
																)}
																<span className="w-1 h-1 bg-border rounded-full" />
																<span>
																	Difficulty: {course.difficulty || 1}
																</span>
															</div>
														</div>

														<div className="flex items-center gap-2 shrink-0">
															{isDraft && (
																<Button
																	className="bg-[#14F195] hover:bg-[#14F195]/90 text-ink-primary dark:text-bg-base font-bold uppercase tracking-widest rounded-none text-xs h-8 px-3"
																	onClick={() => handleSubmitForReview(course)}
																	disabled={isPublishing || !wallet.publicKey}
																>
																	{isPublishing ? (
																		<>Submitting...</>
																	) : (
																		<>
																			<RocketLaunchIcon
																				className="w-4 h-4 mr-1"
																				weight="bold"
																			/>
																			Submit for Review
																		</>
																	)}
																</Button>
															)}
															{isPending && (
																<Button
																	disabled
																	className="bg-[#9945FF]/20 text-[#9945FF] font-bold uppercase tracking-widest rounded-none text-xs h-8 px-3 cursor-not-allowed"
																>
																	In Review
																</Button>
															)}
															<Button
																variant="outline"
																size="icon"
																className="h-8 w-8 rounded-none border-ink-secondary/20 hover:border-ink-primary"
																title="Edit Content"
																asChild
															>
																<Link href="/creator/studio">
																	<PencilSimpleIcon className="w-4 h-4 text-ink-secondary hover:text-ink-primary" />
																</Link>
															</Button>
															<Button
																variant="outline"
																size="icon"
																className="h-8 w-8 rounded-none border-ink-secondary/20 hover:border-ink-primary"
																title="Preview"
																asChild
															>
																<Link href={`/courses/${course.slug}`}>
																	<EyeIcon className="w-4 h-4 text-ink-secondary hover:text-ink-primary" />
																</Link>
															</Button>
															<Button
																variant="outline"
																size="icon"
																className="h-8 w-8 rounded-none border-ink-secondary/20 hover:border-ink-primary"
																title="Settings"
															>
																<GearIcon className="w-4 h-4 text-ink-secondary hover:text-ink-primary" />
															</Button>
														</div>
													</div>
												) : (
													<div
														key={course._id}
														className="border border-ink-secondary/15 bg-bg-surface relative flex flex-col transition-all group hover:border-ink-primary hover:shadow-[6px_6px_0_rgba(13,20,18,0.08)] dark:hover:shadow-[4px_4px_0_var(--color-border)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
													>
														{/* Corner accents */}
														<div className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-ink-primary" />
														<div className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-ink-primary" />

														{/* Thumbnail */}
														<div className="h-[120px] border-b border-ink-secondary/10 bg-ink-secondary/2 dark:bg-ink-secondary/5 relative overflow-hidden flex items-center justify-center">
															{course.imageUrl ? (
																<Image
																	src={course.imageUrl}
																	alt={course.title}
																	fill
																	className="object-cover opacity-80"
																	sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
																/>
															) : (
																<>
																	<div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,var(--color-line-grid)_10px,var(--color-line-grid)_20px)]" />
																	<div className="absolute top-2 right-2 flex gap-2">
																		<span
																			className={cn(
																				"text-[10px] uppercase tracking-widest px-2 py-1 border border-border bg-bg-surface font-bold",
																				isPublished
																					? "text-[#14F195]"
																					: isPending
																						? "text-[#9945FF]"
																						: "text-[#FFB020]",
																			)}
																		>
																			{isPublished
																				? "PUBLISHED"
																				: isPending
																					? "IN REVIEW"
																					: "DRAFT"}
																		</span>
																	</div>
																</>
															)}
														</div>

														{/* Content */}
														<div className="p-4 flex-1 flex flex-col">
															<div className="flex-1">
																<h4 className="font-display font-bold leading-none -tracking-[0.02em] text-[24px] mb-2 line-clamp-2">
																	{course.title}
																</h4>
																<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-ink-secondary uppercase tracking-widest font-bold mb-4">
																	<span>{course.moduleCount || 0} Modules</span>
																	<span className="w-1 h-1 bg-border rounded-full" />
																	<span>Diff: {course.difficulty || 1}</span>
																	{isPublished && (
																		<>
																			<span className="w-1 h-1 bg-border rounded-full" />
																			<span className="text-[#14F195]">
																				{course.onChain?.enrollments || 0}{" "}
																				Enrolled
																			</span>
																		</>
																	)}
																</div>
															</div>

															{/* Actions Footer */}
															<div className="mt-auto pt-4 border-t border-ink-secondary/10 flex flex-col gap-2">
																{isDraft && (
																	<Button
																		className="bg-[#14F195] hover:bg-[#14F195]/90 text-ink-primary dark:text-bg-base font-bold uppercase tracking-widest rounded-none text-[10px] h-8 w-full"
																		onClick={() =>
																			handleSubmitForReview(course)
																		}
																		disabled={isPublishing || !wallet.publicKey}
																	>
																		{isPublishing ? (
																			<>Submitting...</>
																		) : (
																			<>
																				<RocketLaunchIcon
																					className="w-4 h-4 mr-1"
																					weight="bold"
																				/>
																				Submit for Review
																			</>
																		)}
																	</Button>
																)}
																{isPending && (
																	<Button
																		disabled
																		className="bg-[#9945FF]/20 text-[#9945FF] font-bold uppercase tracking-widest rounded-none text-[10px] h-8 w-full cursor-not-allowed"
																	>
																		In Review
																	</Button>
																)}

																<div className="grid grid-cols-3 gap-2">
																	<Button
																		variant="outline"
																		className="h-8 rounded-none border-ink-secondary/20 hover:border-ink-primary hover:text-ink-primary text-xs"
																		title="Edit Content"
																		asChild
																	>
																		<Link
																			href="/creator/studio"
																			className="flex items-center justify-center gap-1"
																		>
																			<PencilSimpleIcon className="w-3 h-3" />{" "}
																			Edit
																		</Link>
																	</Button>
																	<Button
																		variant="outline"
																		className="h-8 rounded-none border-ink-secondary/20 hover:border-ink-primary hover:text-ink-primary text-xs"
																		title="Preview"
																		asChild
																	>
																		<Link
																			href={`/courses/${course.slug}`}
																			className="flex items-center justify-center gap-1"
																		>
																			<EyeIcon className="w-3 h-3" /> View
																		</Link>
																	</Button>
																	<Button
																		variant="outline"
																		className="h-8 rounded-none border-ink-secondary/20 hover:border-ink-primary hover:text-ink-primary text-xs"
																		title="Settings"
																	>
																		<GearIcon className="w-3 h-3" />
																	</Button>
																</div>
															</div>
														</div>
													</div>
												);
											})
										)}
									</div>
								</div>
							</div>
						)}
						<div className="h-12" />
					</main>
				</div>
			</div>
		</div>
	);
}
