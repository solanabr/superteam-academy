import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json();

		// Basic email validation
		if (!email || !email.includes("@")) {
			return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
		}

		// Get locale from headers if available
		const headersList = await headers();
		const locale = headersList.get("accept-language")?.split(",")[0].split("-")[0] || "en";

		// Subscribe via Sanity
		const result = await subscribeToNewsletter(email, {
			source: "homepage",
			locale,
		});

		if (!result.success) {
			return NextResponse.json(
				{ error: result.error || "Failed to subscribe" },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{
				message: "Successfully subscribed to newsletter",
				subscriber: result.subscriber,
			},
			{ status: 200 }
		);
	} catch {
		return NextResponse.json({ error: "Failed to subscribe to newsletter" }, { status: 500 });
	}
}
