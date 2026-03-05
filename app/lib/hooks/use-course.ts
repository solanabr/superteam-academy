/**
 * @fileoverview React hooks for course and enrollment management.
 * Provides hooks for fetching course details, managing enrollments, and tracking progress.
 */

import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram } from "@solana/web3.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { recordEnrollment } from "@/lib/actions/gamification";
import {
	getCoursePda,
	getEnrollmentPda,
	getProgram,
} from "@/lib/anchor/client";
import { CourseDetail, Lesson, Module } from "@/lib/data/course-detail";
import { COURSE_BY_SLUG_QUERY, client } from "@/sanity/client";

interface SanityLesson {
	_id: string;
	title: string;
	type: string;
	duration?: string;
	content: unknown;
	hints?: string[];
	starterCode?: string;
	solutionCode?: string;
	testCases?: string;
}

interface SanityModule {
	_id: string;
	title: string;
	order?: number;
	lessons: SanityLesson[];
}

interface SanityCourse {
	_id: string;
	title: string;
	slug: { current: string } | string;
	description: string;
	difficulty: number;
	track_id: number;
	xp_per_lesson: number;
	onChainStatus?: string;
	prerequisite_course?: { slug: string };
	duration?: string;
	modules: SanityModule[];
}

interface EnrollmentAccount {
	lessonFlags: BN[];
	completedAt: BN | null;
	credentialAsset: import("@solana/web3.js").PublicKey | null;
}

/**
 * Parses the lesson_flags bitmap ([u64; 4]) into a boolean array.
 * @param flags Array of 4 BN objects from Anchor
 */
function parseProgress(flags: BN[]): boolean[] {
	const completed: boolean[] = [];
	// Ensure we handle exactly 4 words as per SPEC.md [u64; 4]
	for (let i = 0; i < 4; i++) {
		const word = flags[i] || new BN(0);
		for (let bit = 0; bit < 64; bit++) {
			completed.push(word.testn(bit));
		}
	}
	return completed;
}

/**
 * Hook to fetch full course details, merging Sanity content with on-chain enrollment state.
 * @param slug - The unique course identifier.
 * @returns A query object containing the detailed CourseDetail.
 */
export function useCourseDetails(slug: string) {
	const wallet = useWallet();

	return useQuery({
		queryKey: ["course", slug, wallet.publicKey?.toBase58()],
		queryFn: async () => {
			// 1. Fetch Content from Sanity
			const sanityCourse = (await client.fetch(
				COURSE_BY_SLUG_QUERY,
				{ slug },
				{ cache: "no-store", perspective: "previewDrafts" },
			)) as SanityCourse;
			if (!sanityCourse) throw new Error("Course not found in Sanity");

			// 2. Fetch On-Chain State
			let enrollment: EnrollmentAccount | null = null;
			let completedFlags: boolean[] = [];

			try {
				const program = getProgram(wallet);
				if (program && wallet.publicKey) {
					const [enrollmentPda] = getEnrollmentPda(slug, wallet.publicKey);
					enrollment = (await program.account.enrollment.fetchNullable(
						enrollmentPda,
					)) as unknown as EnrollmentAccount;
					if (enrollment) {
						completedFlags = parseProgress(enrollment.lessonFlags);
					}
				}
			} catch (e) {
				console.error("Error fetching on-chain state:", e);
			}

			// 3. Merge & Transform
			const modules: Module[] = (sanityCourse.modules || []).map((m, i) => {
				const lessons: Lesson[] = (m.lessons || []).map((l) => {
					return {
						id: l._id,
						title: l.title || "Untitled Lesson",
						duration: l.duration || "N/A",
						type: l.type === "challenge" ? "challenge" : "content",
						content: l.content, // Pass along the PortableText/Markdown content
						hints: l.hints,
						starterCode: l.starterCode,
						solutionCode: l.solutionCode,
						testCases: (() => {
							if (!l.testCases) return [];
							try {
								return JSON.parse(l.testCases);
							} catch (e) {
								console.error("Failed to parse test cases:", e);
								return [];
							}
						})(),
						completed: false,
						locked: false,
					};
				});

				return {
					id: m._id,
					number: m.order || i + 1,
					title: m.title || "Untitled Module",
					description: "",
					duration: "N/A",
					completed: 0,
					total: lessons.length,
					lessons,
				};
			});

			// Calculate actual completion across all modules
			let globalLessonIdx = 0;
			let totalCompleted = 0;
			let totalLessons = 0;

			let previousCompleted = true; // Use sequential check to lock progress

			for (const mod of modules) {
				for (const lesson of mod.lessons) {
					const isDone = completedFlags[globalLessonIdx] || false;
					lesson.completed = isDone;

					// Lock lesson if prior one isn't complete (skip first lesson)
					if (!previousCompleted) {
						lesson.locked = true;
					}

					if (isDone) {
						mod.completed++;
						totalCompleted++;
					} else {
						// The first incomplete lesson blocks all subsequent ones
						previousCompleted = false;
					}

					totalLessons++;
					globalLessonIdx++;
				}
			}

			const course: CourseDetail = {
				id: sanityCourse._id,
				slug:
					typeof sanityCourse.slug === "string"
						? sanityCourse.slug
						: sanityCourse.slug.current,
				title: sanityCourse.title || "UNTITLED COURSE",
				ref: `TRK-${sanityCourse.track_id || 0}`,
				category: "DEV",
				description: sanityCourse.description || "",
				instructor: { name: "Community", username: "@superteam" },
				duration: sanityCourse.duration || "N/A",
				difficulty:
					sanityCourse.difficulty === 3
						? "advanced"
						: sanityCourse.difficulty === 2
							? "intermediate"
							: "beginner",
				xpBounty: (sanityCourse.xp_per_lesson || 100) * totalLessons,
				totalLessons,
				completedLessons: totalCompleted,
				progress:
					totalLessons > 0
						? Math.round((totalCompleted / totalLessons) * 100)
						: 0,
				enrolled: !!enrollment,
				onChainStatus: sanityCourse.onChainStatus,
				completedAt: enrollment?.completedAt?.toNumber() || null,
				credentialAsset: enrollment?.credentialAsset?.toBase58() || null,
				prerequisiteSlug: sanityCourse.prerequisite_course?.slug,
				reviews: [],
				modules,
			};

			return course;
		},
		staleTime: 1000 * 30,
	});
}

/**
 * Hook to enroll a user in a course on-chain.
 * @param slug - The course identifier to enroll in.
 * @param prerequisiteSlug - Optional slug of a prerequisite course.
 * @returns A mutation object for triggering enrollment.
 */
export function useEnroll(slug: string, prerequisiteSlug?: string) {
	const wallet = useWallet();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			if (!wallet.publicKey) throw new Error("Wallet not connected");
			const program = getProgram(wallet);
			if (!program) throw new Error("Program not initialized");

			const [coursePda] = getCoursePda(slug);
			const [enrollmentPda] = getEnrollmentPda(slug, wallet.publicKey);

			const remainingAccounts = [];
			if (prerequisiteSlug) {
				const [prereqCoursePda] = getCoursePda(prerequisiteSlug);
				const [prereqEnrollmentPda] = getEnrollmentPda(
					prerequisiteSlug,
					wallet.publicKey,
				);
				remainingAccounts.push({
					pubkey: prereqCoursePda,
					isWritable: false,
					isSigner: false,
				});
				remainingAccounts.push({
					pubkey: prereqEnrollmentPda,
					isWritable: false,
					isSigner: false,
				});
			}

			const tx = await program.methods
				.enroll(slug)
				.accountsPartial({
					course: coursePda,
					enrollment: enrollmentPda,
					learner: wallet.publicKey,
					systemProgram: SystemProgram.programId,
				})
				.remainingAccounts(remainingAccounts)
				.rpc();

			// Sync with database activity feed
			try {
				await recordEnrollment(slug);
			} catch (e) {
				console.error("Failed to record enrollment in DB:", e);
			}

			return tx;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["course", slug] });
			toast.success("Enrolled successfully!");
		},
		onError: (error: Error) => {
			const message = error.message || String(error);
			toast.error(`Enrollment failed: ${message}`);
		},
	});
}

/**
 * Hook to fetch on-chain credentials (NFTs) using Helius DAS API.
 * @param ownerAddress - Optional wallet address to fetch credentials for. Defaults to connected wallet.
 */
export function useCredentials(ownerAddress?: string) {
	const wallet = useWallet();

	const targetAddress = ownerAddress || wallet.publicKey?.toBase58();

	return useQuery({
		queryKey: ["credentials", targetAddress],
		queryFn: async () => {
			if (!targetAddress) return [];

			const rpcUrl = process.env.NEXT_PUBLIC_CLUSTER_URL || "";
			// Helius DAS API is only available on mainnet or specific Helius endpoints.
			// For devnet, we might need a fallback or a specific Helius devnet URL.
			if (!rpcUrl.includes("helius")) {
				console.info(
					"Helius DAS API not detected. Falling back to direct Metaplex Core scan for achievements.",
				);
			}

			try {
				// 1. Try Helius DAS API (Best for metadata)
				if (rpcUrl.includes("helius")) {
					const response = await fetch(rpcUrl, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							jsonrpc: "2.0",
							id: "get-credentials",
							method: "getAssetsByOwner",
							params: {
								ownerAddress: targetAddress,
								page: 1,
								limit: 100,
								displayOptions: { showCollectionMetadata: true },
							},
						}),
					});

					const { result } = await response.json();
					if (result?.items) return result.items;
				}

				// 2. Fallback: Direct Metaplex Core Scan (No DAS required)
				const { connection, MPL_CORE_PROGRAM_ID } = await import(
					"@/lib/anchor/client"
				);
				const assets = await connection.getProgramAccounts(
					MPL_CORE_PROGRAM_ID,
					{
						filters: [
							{
								memcmp: {
									offset: 1, // Owner starts at offset 1
									bytes: targetAddress,
								},
							},
						],
					},
				);

				// Map to a structure similar to Helius for compatibility
				return assets.map((a) => {
					const data = a.account.data;
					// Basic parsing of name from Core Asset layout (Offset 66: length (4) + data)
					let name = "On-Chain Certificate";
					try {
						const nameLen = data.readUInt32LE(66);
						name = data.slice(70, 70 + nameLen).toString("utf-8");
					} catch {
						/* ignore parsing error */
					}

					return {
						id: a.pubkey.toBase58(),
						content: {
							metadata: {
								name: name,
								attributes: [], // Attributes aren't easily parsed from raw buffer without full PDA logic
							},
						},
					};
				});
			} catch (error) {
				console.error("Error fetching credentials:", error);
				return [];
			}
		},
		enabled: !!targetAddress,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

/**
 * Hook to quickly fetch course progress percentage for catalog cards
 */
export function useCourseProgress(slug: string, totalLessons?: number) {
	const wallet = useWallet();

	return useQuery({
		queryKey: ["courseProgress", slug, wallet.publicKey?.toBase58()],
		queryFn: async () => {
			if (!wallet.publicKey) return 0;
			const program = getProgram(wallet);
			if (!program) return 0;

			const [enrollmentPda] = getEnrollmentPda(slug, wallet.publicKey);

			try {
				const enrollment = (await program.account.enrollment.fetchNullable(
					enrollmentPda,
				)) as unknown as EnrollmentAccount;
				if (!enrollment) return 0;

				const completedFlags = parseProgress(enrollment.lessonFlags).filter(
					Boolean,
				).length;
				if (!totalLessons || totalLessons === 0) return 0;

				return Math.round((completedFlags / totalLessons) * 100);
			} catch {
				return 0;
			}
		},
		enabled: !!wallet.publicKey,
		staleTime: 1000 * 60, // 1 minute
	});
}
/**
 * Hook to claim a course credential (NFT) on-chain.
 */
export function useClaimCredential(slug: string) {
	const wallet = useWallet();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			if (!wallet.publicKey) throw new Error("Wallet not connected");

			const res = await fetch("/api/course/credential/issue", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					courseSlug: slug,
					learnerAddress: wallet.publicKey.toBase58(),
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to issue credential");
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["course", slug] });
			toast.success("Credential Issued! Check your wallet for your NFT.");
		},
		onError: (error: Error) => {
			toast.error(`Claim failed: ${error.message}`);
		},
	});
}
