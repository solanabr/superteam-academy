/**
 * @fileoverview Course review submission route handler.
 * Updates the course status to 'review_pending' in Sanity for editorial review.
 */
import { NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { getSessionServer } from "@/lib/auth/server";
import { getPostHogClient } from "@/lib/posthog-server";

// We need a write-enabled client using a server-side token
const writeClient = createClient({
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "replace-me-123",
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
	apiVersion: "2024-02-20",
	token: process.env.SANITY_API_TOKEN, // Needed for write access
	useCdn: false,
});

/**
 * Handles the submission of a course for editorial review.
 * Updates the course status to `review_pending` in Sanity.
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { courseId, creatorWallet } = body;

		if (!courseId || !creatorWallet) {
			return NextResponse.json(
				{ error: "Course ID and creator wallet are required" },
				{ status: 400 },
			);
		}

		const session = await getSessionServer();
		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized: Invalid session" },
				{ status: 401 },
			);
		}

		if (!process.env.SANITY_API_TOKEN) {
			return NextResponse.json(
				{ error: "Server misconfiguration: SANITY_API_TOKEN missing" },
				{ status: 500 },
			);
		}

		// Patch the Sanity document's status to 'review_pending'
		await writeClient
			.patch(courseId)
			.set({
				status: "review_pending",
				creatorWallet: creatorWallet,
			})
			.commit();

		// Track course review submission server-side
		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: session.user.id,
			event: "course_submitted_for_review",
			properties: {
				course_id: courseId,
				creator_wallet: creatorWallet,
			},
		});
		await posthog.shutdown();

		return NextResponse.json({
			success: true,
			message: "Course submitted for review successfully",
		});
	} catch (error) {
		console.error("Error submitting course for review:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to update course status",
			},
			{ status: 500 },
		);
	}
}
