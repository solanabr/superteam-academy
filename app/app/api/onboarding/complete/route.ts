import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { syncUserToSanity } from "@/lib/sanity-users";

export async function POST(request: NextRequest) {
	try {
		// Validate required environment variables
		if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
			return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
		}
		if (!process.env.SANITY_API_WRITE_TOKEN) {
			return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
		}

		const requestHeaders = await headers();
		const session = await serverAuth.api.getSession({ headers: requestHeaders });
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const {
			username,
			name,
			bio,
			location,
			website,
			title,
			company,
			preferredTopics,
			timeCommitment,
			learningGoals,
			experienceLevel,
			onboardingCompleted,
			onboardingStep,
		} = body;

		// Update user in Sanity with onboarding data
		const user = await syncUserToSanity({
			authId: session.user.id,
			name: name || session.user.name,
			email: session.user.email || "",
			walletAddress: body.walletAddress,
			image: session.user.image || "",
		});

		if (!user) {
			return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
		}

		const updateData: Record<string, unknown> = {
			username,
			bio,
			location,
			website,
			title,
			company,
			preferredTopics,
			timeCommitment,
			learningGoals,
			experienceLevel,
			onboardingCompleted,
			onboardingStep,
		};

		// Remove undefined values
		Object.keys(updateData).forEach((key) => {
			if (updateData[key] === undefined) {
				delete updateData[key];
			}
		});

		// Update user document with onboarding data
		const { createSanityClient } = await import("@superteam-academy/cms");
		const client = createSanityClient({
			projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
			dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
			token: process.env.SANITY_API_WRITE_TOKEN,
			useCdn: false,
		});

		await client.patch(user._id).set(updateData).commit();

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Onboarding completion error:", error);
		return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
	}
}
