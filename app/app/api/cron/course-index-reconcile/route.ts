import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { maybeRunAutoCourseIndexReconcile } from "@/lib/course-index-sync";

async function isAuthorized(): Promise<boolean> {
	const secret = process.env.CRON_SECRET;
	if (!secret) return true;

	const requestHeaders = await headers();
	const bearer = requestHeaders.get("authorization");
	const direct = requestHeaders.get("x-cron-secret");

	if (direct && direct === secret) return true;
	if (bearer && bearer.startsWith("Bearer ") && bearer.slice(7) === secret) return true;

	return false;
}

export async function GET() {
	if (!(await isAuthorized())) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const result = await maybeRunAutoCourseIndexReconcile({ force: true });
		return NextResponse.json({ result });
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to run reconcile cron" },
			{ status: 500 }
		);
	}
}
