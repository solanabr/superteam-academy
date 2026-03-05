/**
 * @fileoverview Administrative dashboard for platform governance.
 * Handles course approvals, program initialization, and system monitoring.
 */

"use client";

import {
	BookOpenIcon,
	CheckCircleIcon,
	CoinsIcon,
	KeyIcon,
	PaperPlaneRightIcon,
	RocketLaunchIcon,
	ShieldCheckIcon,
	ShieldIcon,
	ShieldWarningIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { NavRail } from "@/components/layout/NavRail";
import { StatCard } from "@/components/shared/StatCard";
import { TopBar } from "@/components/layout/TopBar";
import { DotGrid } from "@/components/shared/DotGrid";
import { Button } from "@/components/ui/button";
import {
	connection,
	getConfigPda,
	getProgram,
	XP_MINT,
} from "@/lib/anchor/client";
import { getAdminDashboardStats, getSystemLogs } from "@/lib/actions/admin";
import { mockMinters } from "@/lib/data/admin";
import { cn } from "@/lib/utils";
import { client, PENDING_REVIEW_COURSES_QUERY } from "@/sanity/client";

/**
 * Course data structure for the review queue.
 */
interface PendingCourse {
	_id: string;
	title: string;
	slug: string;
	difficulty: number;
	xp_per_lesson: number;
	moduleCount: number;
	creatorWallet?: string;
	_updatedAt: string;
}

interface ActionLog {
	id: string;
	action: string;
	type: string;
	wallet: string;
	timestamp: string;
	details?: string | null;
	status: "SUCCESS" | "FAILED" | "PENDING";
}

/**
 * Main administrative dashboard component.
 */
export function AdminView() {
	const [pendingCourses, setPendingCourses] = useState<PendingCourse[]>([]);
	const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [publishing, setPublishing] = useState<string | null>(null);
	const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
	const [isInitializing, setIsInitializing] = useState(false);
	const [onChainAuthority, setOnChainAuthority] = useState<string | null>(null);
	const [adminStats, setAdminStats] = useState({
		totalLearners: 0,
		xpMinted: 0,
		activeCourses: 0,
		pendingReviews: 0,
		activeEnrollments: 0,
		completionRate: 0,
	});
	const wallet = useWallet();

	useEffect(() => {
		async function checkInit() {
			if (wallet.publicKey) {
				const [configPda] = getConfigPda();
				const accountInfo = await connection.getAccountInfo(configPda);
				setIsInitialized(!!accountInfo);

				if (accountInfo) {
					const program = getProgram(wallet);
					if (program) {
						const config = await program.account.config.fetch(configPda);
						setOnChainAuthority(config.authority.toBase58());
					}
				}
			}
		}

		async function fetchPending() {
			try {
				const data = await client.fetch(PENDING_REVIEW_COURSES_QUERY);
				setPendingCourses(data);
			} catch (e) {
				console.error("Error fetching pending courses", e);
			} finally {
				setLoading(false);
			}
		}

		async function fetchStats() {
			try {
				const statsData = await getAdminDashboardStats();
				setAdminStats(statsData);
			} catch (e) {
				console.error("Error fetching admin stats", e);
			}
		}

		async function fetchLogs() {
			try {
				const logs = await getSystemLogs();
				setActionLogs(logs as ActionLog[]);
			} catch (e) {
				console.error("Error fetching logs", e);
			}
		}

		checkInit();
		fetchPending();
		fetchStats();
		fetchLogs();
	}, [wallet]);

	// Handle Initializing the program
	async function handleInitialize() {
		if (!wallet.publicKey) {
			toast.error("Please connect your wallet first");
			return;
		}

		const program = getProgram(wallet);
		if (!program) {
			toast.error("Failed to initialize program");
			return;
		}

		setIsInitializing(true);
		toast.info("Initializing program...");

		try {
			const res = await fetch("/api/init");
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || "Failed to fetch mint keypair");
			}
			const { secretKey } = await res.json();
			const xpMintKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

			const [configPda] = getConfigPda();
			const [minterPda] = PublicKey.findProgramAddressSync(
				[Buffer.from("minter"), wallet.publicKey.toBuffer()],
				program.programId,
			);

			const tx = await program.methods
				.initialize()
				.accountsPartial({
					config: configPda,
					xpMint: XP_MINT,
					authority: wallet.publicKey,
					backendMinterRole: minterPda,
					systemProgram: SystemProgram.programId,
					tokenProgram: TOKEN_2022_PROGRAM_ID,
				})
				.signers([xpMintKeypair])
				.rpc();

			console.log("Initialization transaction:", tx);
			toast.success("Program initialized successfully!");
			setIsInitialized(true);
		} catch (error) {
			console.error("Init Error:", error);
			toast.error(
				`Initialization Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsInitializing(false);
		}
	}

	const handleApprove = async (course: PendingCourse) => {
		if (!course.creatorWallet) {
			toast.error("Error: Course is missing creator wallet address");
			return;
		}

		setPublishing(course._id);
		const toastId = toast.loading(`Publishing "${course.title}" to Solana...`);

		try {
			const response = await fetch("/api/course/publish", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					courseSlug: course.slug,
					courseId: course._id,
					creatorAddress: course.creatorWallet,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setPendingCourses((prev) => prev.filter((c) => c._id !== course._id));
				toast.success("Course published and registered on-chain!", {
					id: toastId,
				});
				// Refresh stats and logs
				const statsData = await getAdminDashboardStats();
				setAdminStats(statsData);
				const logs = await getSystemLogs();
				setActionLogs(logs as ActionLog[]);
			} else {
				toast.error(data.error || "Failed to publish course", { id: toastId });
			}
		} catch (error) {
			console.error("Error publishing course", error);
			toast.error("Network error during publication", { id: toastId });
		} finally {
			setPublishing(null);
		}
	};

	return (
		<div className="min-h-screen bg-bg-base relative">
			<DotGrid opacity={0.3} />

			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full relative z-10">
				<div className="col-span-1 lg:col-span-2">
					<TopBar />
				</div>

				<NavRail />

				<main className="px-4 py-6 lg:px-8 lg:py-8 flex flex-col gap-10 overflow-visible lg:overflow-y-auto relative z-10 h-full w-full">
					{/* Header */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-ink-secondary/20 dark:border-border pb-6">
						<div>
							<span className="bg-[#9945FF] text-white px-2 py-1 text-[10px] uppercase tracking-widest inline-block mb-2 font-bold">
								Admin Privileges
							</span>
							<h1 className="font-display text-4xl lg:text-5xl leading-none -tracking-wider text-ink-primary">
								COMMAND CENTER
							</h1>
							<p className="text-ink-secondary mt-2 max-w-xl text-sm">
								System overview and platform governance controls.
							</p>
						</div>

						<div className="flex items-center gap-3 border border-border bg-surface px-4 py-2">
							<ShieldCheckIcon
								weight="duotone"
								className="w-5 h-5 text-[#14F195]"
							/>
							<div className="text-xs">
								<div className="text-[10px] uppercase tracking-widest text-ink-secondary">
									Active Authority
								</div>
								<div className="font-mono font-bold">
									{onChainAuthority
										? `${onChainAuthority.slice(0, 4)}...${onChainAuthority.slice(-4)}`
										: "Loading..."}
								</div>
							</div>
						</div>
					</div>

					{/* Initialization Status (Admin Only) */}
					{isInitialized === false && (
						<div className="border border-[#FFB020]/30 bg-[#FFB020]/5 p-8 text-center rounded-none border-t-4 border-t-[#FFB020] shadow-lg">
							<RocketLaunchIcon
								weight="duotone"
								className="w-12 h-12 mx-auto mb-4 text-[#FFB020]"
							/>
							<h2 className="font-display text-2xl mb-2 text-[#FFB020]">
								PLATFORM NOT INITIALIZED
							</h2>
							<p className="text-ink-secondary mb-6 leading-relaxed max-w-lg mx-auto text-xs">
								The protocol needs to be initialized. This will configure the
								Global PDA, register the XP Mint, and assign your wallet as the
								authorized governor.
							</p>
							<Button
								className="bg-ink-primary hover:bg-ink-primary/90 text-[#14F195] font-bold uppercase tracking-widest rounded-none h-10 px-6 text-xs"
								onClick={handleInitialize}
								disabled={isInitializing}
							>
								{isInitializing
									? "Processing..."
									: "Initialize Protocol & XP Mint"}
							</Button>
						</div>
					)}

					{/* Stat Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						<StatCard
							label="TOTAL LEARNERS"
							value={adminStats.totalLearners.toLocaleString()}
							icon={<UsersIcon className="w-5 h-5" weight="duotone" />}
						/>
						<StatCard
							label="ON-CHAIN XP MINTED"
							value={adminStats.xpMinted.toLocaleString()}
							icon={<CoinsIcon className="w-5 h-5" weight="duotone" />}
						/>
						<StatCard
							label="ACTIVE COURSES"
							value={adminStats.activeCourses.toString()}
							icon={<BookOpenIcon className="w-5 h-5" weight="duotone" />}
						/>
						<StatCard
							label="PENDING REVIEWS"
							value={adminStats.pendingReviews.toString()}
							icon={<ShieldCheckIcon className="w-5 h-5" weight="duotone" />}
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Left Column */}
						<div className="lg:col-span-2 flex flex-col gap-10">
							{/* Course Review Queue */}
							<div>
								<h2 className="font-display text-xl uppercase tracking-widest text-ink-primary border-b border-border pb-2 mb-4 flex items-center gap-2">
									<BookOpenIcon weight="duotone" className="text-[#9945FF]" />
									Review Queue
								</h2>

								{loading ? (
									<div className="p-8 text-center border border-dashed border-ink-secondary/30 bg-bg-surface">
										<p className="text-ink-secondary text-sm uppercase tracking-widest text-[10px] font-bold">
											Loading pending courses...
										</p>
									</div>
								) : pendingCourses.length === 0 ? (
									<div className="p-8 text-center border border-dashed border-ink-secondary/30 bg-bg-surface">
										<p className="text-ink-secondary uppercase tracking-widest text-[10px] font-bold">
											No courses currently pending review.
										</p>
									</div>
								) : (
									<div className="space-y-4">
										{pendingCourses.map((course) => (
											<div
												key={course._id}
												className="border border-border bg-bg-surface relative p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:border-ink-primary transition-colors cursor-default"
											>
												<div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
												<div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
												<div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
												<div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>

												<div className="relative z-10">
													<h3 className="font-bold text-lg text-ink-primary">
														{course.title}
													</h3>
													<p className="text-sm font-mono text-ink-secondary mb-2">
														/{course.slug}
													</p>
													<div className="flex items-center gap-4 text-xs text-ink-tertiary">
														<span>Difficulty: {course.difficulty}</span>
														<span>Modules: {course.moduleCount}</span>
														<span>{course.xp_per_lesson} XP / lesson</span>
													</div>
												</div>
												<Button
													onClick={() => handleApprove(course)}
													disabled={publishing === course._id}
													className="shrink-0 bg-[#9945FF] hover:bg-[#9945FF]/90 text-white border-none rounded-none w-full md:w-auto font-bold uppercase tracking-widest text-xs h-10 px-6 flex items-center gap-2 relative z-10"
												>
													{publishing === course._id
														? "Publishing..."
														: "Approve & Publish"}
													{!publishing && <PaperPlaneRightIcon weight="fill" />}
												</Button>
											</div>
										))}
									</div>
								)}
							</div>

							{/* System Logs */}
							<div>
								<h2 className="font-display text-xl uppercase tracking-widest text-ink-primary border-b border-border pb-2 mb-4">
									System Logs
								</h2>

								<div className="border border-border bg-surface/50 divide-y divide-border font-mono text-sm shadow-sm backdrop-blur-sm h-[600px] overflow-y-auto">
									{actionLogs.length === 0 ? (
										<div className="p-8 text-center text-ink-tertiary italic text-xs">
											-- NO SYSTEM ACTIVITY RECORDED --
										</div>
									) : (
										actionLogs.map((log) => (
											<div
												key={log.id}
												className="p-3 flex items-start gap-4 hover:bg-fg-base/5 transition-colors"
											>
												<div className="pt-1">
													{log.type === "course_published" && (
														<PaperPlaneRightIcon className="w-4 h-4 text-[#9945FF]" />
													)}
													{log.type === "enrolled" && (
														<UsersIcon className="w-4 h-4 text-[#00C2FF]" />
													)}
													{(log.type === "course_completed" ||
														log.type === "lesson_completed") && (
														<CheckCircleIcon className="w-4 h-4 text-[#14F195]" />
													)}
													{log.type === "achievement" && (
														<RocketLaunchIcon className="w-4 h-4 text-[#FFB020]" />
													)}
													{![
														"course_published",
														"enrolled",
														"course_completed",
														"lesson_completed",
														"achievement",
													].includes(log.type) && (
														<ShieldIcon className="w-4 h-4 text-ink-tertiary" />
													)}
												</div>
												<div className="flex-1">
													<div className="flex justify-between items-center mb-1">
														<span className="font-bold uppercase text-xs tracking-wider text-ink-primary">
															{log.action}
														</span>
														<span className="text-[10px] text-ink-tertiary whitespace-nowrap ml-2">
															{log.timestamp}
														</span>
													</div>
													<div className="text-ink-secondary text-[10px] truncate max-w-[200px] md:max-w-md">
														ID: {log.wallet}
													</div>
													{log.details && (
														<div className="text-ink-tertiary text-[10px] mt-1 border-l border-border pl-2 border-l-ink-secondary/50">
															{log.details}
														</div>
													)}
												</div>
											</div>
										))
									)}
								</div>
							</div>
						</div>

						{/* Sidebar Controls */}
						<div className="flex flex-col gap-6">
							<div>
								<h2 className="font-display text-xl uppercase tracking-widest text-ink-primary border-b border-border pb-2 mb-4">
									Minter Roles
								</h2>

								<div className="space-y-3">
									{mockMinters.map((minter) => (
										<div
											key={minter.pubkey}
											className={cn(
												"border border-border bg-surface p-3",
												!minter.isActive && "opacity-50",
											)}
										>
											<div className="flex justify-between items-center mb-2">
												<div className="flex items-center gap-2">
													<KeyIcon
														className={cn(
															"w-4 h-4",
															minter.isActive
																? "text-[#14F195]"
																: "text-ink-secondary",
														)}
														weight="fill"
													/>
													<span className="font-bold text-xs uppercase">
														{minter.label}
													</span>
												</div>
												{!minter.isActive && (
													<span className="text-[9px] uppercase tracking-widest text-[#F92424] bg-[#F92424]/10 px-1">
														Revoked
													</span>
												)}
											</div>
											<div className="text-[10px] font-mono text-ink-secondary break-all mb-2">
												{minter.pubkey}
											</div>
											<div className="text-xs text-ink-tertiary">
												Total Minted:{" "}
												<span className="text-ink-primary font-bold">
													{minter.totalXpMinted.toLocaleString()} XP
												</span>
											</div>
										</div>
									))}
									<Button
										variant="outline"
										className="w-full text-xs uppercase rounded-none mt-2 border-dashed"
									>
										+ Register New Minter
									</Button>
								</div>
							</div>

							<div className="border border-[#F92424]/30 bg-[#F92424]/5 p-4 relative overflow-hidden">
								<ShieldIcon
									className="absolute -right-4 -bottom-4 w-24 h-24 text-[#F92424]/10"
									weight="fill"
								/>
								<h3 className="text-[#F92424] font-bold uppercase tracking-widest text-xs mb-2 relative z-10 flex items-center gap-2">
									<ShieldWarningIcon className="w-4 h-4" /> Danger Zone
								</h3>
								<p className="text-xs text-ink-secondary mb-4 relative z-10">
									Emergency controls require multi-sig approval.
								</p>
								<Button
									variant="outline"
									className="w-full text-xs uppercase text-[#F92424] border-[#F92424]/30 hover:bg-[#F92424] hover:text-white rounded-none relative z-10"
								>
									Pause Program
								</Button>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
