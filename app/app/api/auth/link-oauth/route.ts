import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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

		const cookieStore = await cookies();
		const raw = cookieStore.get("linked_accounts")?.value;
		const accounts: Array<{
			provider: string;
			identifier: string;
			linkedAt: string;
		}> = raw
			? (JSON.parse(raw) as Array<{ provider: string; identifier: string; linkedAt: string }>)
			: [];

		const nextAccounts = accounts.filter((account) => account.provider !== body.provider);
		nextAccounts.push({
			provider: body.provider,
			identifier,
			linkedAt: new Date().toISOString(),
		});

		cookieStore.set("linked_accounts", JSON.stringify(nextAccounts), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 30 * 24 * 60 * 60,
			path: "/",
		});

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
