import { type NextRequest, NextResponse } from "next/server";
import { updateUserRole, getAdminUsers } from "@/lib/sanity-users";
import { requireAdmin, requireRole } from "@/lib/route-utils";
import type { UserRole } from "@superteam-academy/cms";

export async function GET() {
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	const admins = await getAdminUsers();
	return NextResponse.json({ admins });
}

export async function POST(request: NextRequest) {
	const auth = await requireRole("superadmin")
	if (!auth.ok) return auth.response;

	const body = (await request.json()) as { userId: string; role: UserRole };
	if (!body.userId || !["learner", "admin", "superadmin"].includes(body.role)) {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}

	const success = await updateUserRole(body.userId, body.role);
	if (!success) {
		return NextResponse.json({ error: "Failed to update role" }, { status: 400 });
	}

	return NextResponse.json({ success: true });
}
