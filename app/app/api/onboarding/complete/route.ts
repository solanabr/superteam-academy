import { type NextRequest, NextResponse } from "next/server";
import { syncUserToSanity } from "@/lib/sanity-users";
import { requireSession, sanityWriteClient } from "@/lib/route-utils";

export async function POST(request: NextRequest) {
	try {
		if (!sanityWriteClient) {
			return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
		}

		const auth = await requireSession();
		if (!auth.ok) return auth.response;
		const session = auth.session;

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

		for (const key of Object.keys(updateData)) {
			if (updateData[key] === undefined) {
				delete updateData[key];
			}
		}

		await sanityWriteClient.patch(user._id).set(updateData).commit();

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Onboarding completion error:", error);
		return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
	}
}
