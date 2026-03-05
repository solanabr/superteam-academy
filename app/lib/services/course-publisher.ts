/**
 * @fileoverview Service for publishing courses from Sanity to the Solana blockchain.
 * Handles validation, on-chain state checks, and backend API integration.
 */

import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { client } from "@/sanity/client";
import { getCoursePda } from "../anchor/client";
import { OnchainAcademy } from "../anchor/idl/onchain_academy";

/**
 * Status of the course publication process.
 */
export interface CoursePublishStatus {
	status: "draft" | "publishing" | "published" | "error";
	coursePda?: string;
	txSignature?: string;
	error?: string;
}

/**
 * Publish a course from Sanity to the blockchain
 */
export async function publishCourseToChain(
	program: Program<OnchainAcademy>,
	courseSlug: string,
	authorityWallet: PublicKey,
): Promise<CoursePublishStatus> {
	try {
		// 1. Fetch course from Sanity
		const course = await client.fetch(
			`*[_type == "course" && slug.current == $slug][0] {
        _id,
        title,
        "slug": slug.current,
        description,
        difficulty,
        track_id,
        track_level,
        xp_per_lesson,
        creator_reward_xp,
        min_completions_for_reward,
        "moduleCount": count(modules),
        modules[]-> {
          lessons[]-> {
            _id
          }
        }
      }`,
			{ slug: courseSlug },
		);

		if (!course) {
			throw new Error("Course not found in Sanity");
		}

		// 2. Validate course data
		if (!course.slug) {
			throw new Error("Course must have a slug");
		}

		if (!course.moduleCount || course.moduleCount === 0) {
			throw new Error("Course must have at least one module");
		}

		interface SanityModule {
			lessons?: { _id: string }[];
		}

		// Count total lessons
		const totalLessons =
			course.modules?.reduce(
				(sum: number, module: SanityModule) =>
					sum + (module.lessons?.length || 0),
				0,
			) || 0;

		if (totalLessons === 0) {
			throw new Error("Course must have at least one lesson");
		}

		// 3. Check if course already exists on-chain
		const [coursePda] = getCoursePda(course.slug);
		const existingCourse =
			await program.account.course.fetchNullable(coursePda);

		if (existingCourse) {
			return {
				status: "published",
				coursePda: coursePda.toBase58(),
				error: "Course already published on-chain",
			};
		}

		// 4. Send request to backend API to publish the course
		const response = await fetch("/api/course/publish", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				courseId: course._id,
				courseSlug: course.slug,
				creatorAddress: authorityWallet.toBase58(),
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Failed to publish course via API");
		}

		console.log(
			"Course published to chain via backend API. Update Sanity manually with PDA:",
			data.coursePda,
		);

		return {
			status: "published",
			coursePda: data.coursePda,
			txSignature: data.signature,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Failed to publish course";
		console.error("Error publishing course:", error);
		return {
			status: "error",
			error: errorMessage,
		};
	}
}

/**
 * Check if a course is published on-chain
 */
export async function checkCourseOnChainStatus(
	program: Program<OnchainAcademy>,
	courseSlug: string,
): Promise<{
	isPublished: boolean;
	coursePda?: string;
	enrollments?: number;
	isActive?: boolean;
}> {
	try {
		const [coursePda] = getCoursePda(courseSlug);
		const course = await program.account.course.fetchNullable(coursePda);

		if (!course) {
			return { isPublished: false };
		}

		return {
			isPublished: true,
			coursePda: coursePda.toBase58(),
			enrollments: course.totalEnrollments,
			isActive: course.isActive,
		};
	} catch (error) {
		console.error("Error checking course status:", error);
		return { isPublished: false };
	}
}

/**
 * Get all courses from Sanity with their on-chain status
 */
export async function getCoursesWithStatus(program: Program<OnchainAcademy>) {
	try {
		// Fetch all courses from Sanity
		const courses = await client.fetch(`
      *[_type == "course"] {
        _id,
        title,
        "slug": slug.current,
        description,
        "imageUrl": image.asset->url,
        difficulty,
        track_id,
        track_level,
        xp_per_lesson,
        creator_reward_xp,
        min_completions_for_reward,
        onChainStatus,
        coursePda,
        publishedAt,
        "moduleCount": count(modules)
      }
    `);

		// Check on-chain status for each course
		const coursesWithStatus = await Promise.all(
			courses.map(async (course: { slug: string; [key: string]: unknown }) => {
				const onChainStatus = await checkCourseOnChainStatus(
					program,
					course.slug,
				);
				return {
					...course,
					onChain: onChainStatus,
				};
			}),
		);

		return coursesWithStatus;
	} catch (error) {
		console.error("Error fetching courses:", error);
		return [];
	}
}
