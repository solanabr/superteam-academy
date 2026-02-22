import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/sanity-users";
import { getUserStats } from "@/lib/sanity-users";
import { getCoursesCMS } from "@/lib/cms";

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

	const [userStats, courses] = await Promise.all([getUserStats(), getCoursesCMS()]);

	return NextResponse.json({
		totalUsers: userStats.totalUsers,
		activeUsers: userStats.activeUsers,
		adminCount: userStats.adminCount,
		totalEnrollments: userStats.totalEnrollments,
		totalCourses: courses.length,
		publishedCourses: courses.filter((c) => c.published).length,
	});
}
