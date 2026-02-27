import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/sanity-users";
import { getUserStats } from "@/lib/sanity-users";
import { getAllUsers } from "@/lib/sanity-users";
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

	const [userStats, courses, users] = await Promise.all([
		getUserStats(),
		getCoursesCMS(),
		getAllUsers(10_000, 0),
	]);

	const onboardingCompletedUsers = users.filter((user) => user.onboardingCompleted).length;
	const completionStageUsers = users.filter(
		(user) => (user.completedCourses?.length ?? 0) > 0
	).length;
	const activatedUsers = users.filter((user) => (user.enrolledCourses?.length ?? 0) > 0).length;

	const now = Date.now();
	const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
	const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

	const recentUsers7d = users.filter((user) => {
		if (!user._createdAt) return false;
		return new Date(user._createdAt).getTime() >= sevenDaysAgo;
	}).length;

	const recentUsers30d = users.filter((user) => {
		if (!user._createdAt) return false;
		return new Date(user._createdAt).getTime() >= thirtyDaysAgo;
	}).length;

	return NextResponse.json({
		totalUsers: userStats.totalUsers,
		activeUsers: userStats.activeUsers,
		adminCount: userStats.adminCount,
		totalEnrollments: userStats.totalEnrollments,
		totalCourses: courses.length,
		publishedCourses: courses.filter((c) => c.published).length,
		activationFunnel: {
			signups: userStats.totalUsers,
			onboardingCompleted: onboardingCompletedUsers,
			activated: activatedUsers,
			completed: completionStageUsers,
		},
		cohorts: {
			recentSignups7d: recentUsers7d,
			recentSignups30d: recentUsers30d,
		},
	});
}
