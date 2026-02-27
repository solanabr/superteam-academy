import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { upsertLinkedAccount } from "@/lib/auth-linking-store";
import { getUserByAuthId, syncUserToSanity } from "@/lib/sanity-users";

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			provider?: string;
			identifier?: string;
		};

		if (body.provider !== "google" && body.provider !== "github") {
			return NextResponse.json(
				{ error: "Provider must be google or github" },
				{ status: 400 }
			);
		}

		const identifier = body.identifier?.trim();
		if (!identifier) {
			return NextResponse.json({ error: "Missing identifier" }, { status: 400 });
		}

		const requestHeaders = await headers();
		const session = await serverAuth.api.getSession({ headers: requestHeaders });
		if (!session) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const existingUser = await getUserByAuthId(session.user.id);
		if (!existingUser) {
			await syncUserToSanity({
				authId: session.user.id,
				name: session.user.name,
				email: session.user.email,
				...(session.user.image ? { image: session.user.image } : {}),
			});
		}

		const result = await upsertLinkedAccount({
			userId: session.user.id,
			provider: body.provider,
			identifier,
		});

		if (!result.linked) {
			if (result.reason === "storage-unavailable") {
				return NextResponse.json({ error: "Sanity storage unavailable" }, { status: 503 });
			}

			if (result.reason === "user-not-found") {
				return NextResponse.json({ error: "Sanity user not found" }, { status: 404 });
			}

			return NextResponse.json(
				{ error: "Account is already linked to a different user" },
				{ status: 409 }
			);
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
