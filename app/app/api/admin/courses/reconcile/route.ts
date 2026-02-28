import { NextResponse } from "next/server";
import { reconcileCourseIndex } from "@/lib/course-index-sync";
import { requireAdmin } from "@/lib/route-utils";

export async function GET() {
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

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
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

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
