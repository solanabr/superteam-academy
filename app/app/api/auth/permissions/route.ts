import { NextResponse } from "next/server";
import { requireSession } from "@/lib/route-utils";
import { isUserAdmin, isUserSuperAdmin } from "@/lib/sanity-users";

export async function GET() {
	const auth = await requireSession();
	if (!auth.ok) return auth.response;
	const { session } = auth;

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
