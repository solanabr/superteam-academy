import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin, isUserSuperAdmin, updateUserRole, getAdminUsers } from "@/lib/sanity-users";
import type { UserRole } from "@superteam-academy/cms";

export async function GET() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const admins = await getAdminUsers();
	return NextResponse.json({ admins });
}

export async function POST(request: NextRequest) {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const superAdmin = await isUserSuperAdmin(session.user.id);
	if (!superAdmin) {
		return NextResponse.json({ error: "Only super admins can modify roles" }, { status: 403 });
	}

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
