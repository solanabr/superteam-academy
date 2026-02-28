import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin, isUserSuperAdmin } from "@/lib/sanity-users";

export async function GET() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const [admin, superAdmin] = await Promise.all([
		isUserAdmin(session.user.id, session.user.email),
		isUserSuperAdmin(session.user.id, session.user.email),
	]);

	return NextResponse.json({
		isAdmin: admin,
		isSuperAdmin: superAdmin,
		role: superAdmin ? "superadmin" : admin ? "admin" : "learner",
	});
}
