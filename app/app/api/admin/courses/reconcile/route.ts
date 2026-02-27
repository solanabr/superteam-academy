import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/sanity-users";
import { reconcileCourseIndex } from "@/lib/course-index-sync";

async function assertAdmin() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return { ok: false as const, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
	}

	const admin = await isUserAdmin(session.user.id);
	if (!admin) {
		return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
	}

	return { ok: true as const };
}

export async function GET() {
	const guard = await assertAdmin();
	if (!guard.ok) return guard.response;

	try {
		const report = await reconcileCourseIndex({ apply: false });
		return NextResponse.json({ report });
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to run reconcile preview" },
			{ status: 500 }
		);
	}
}

export async function POST() {
	const guard = await assertAdmin();
	if (!guard.ok) return guard.response;

	try {
		const report = await reconcileCourseIndex({ apply: true });
		return NextResponse.json({ report });
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to apply reconcile" },
			{ status: 500 }
		);
	}
}
