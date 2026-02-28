import { NextResponse } from "next/server";
import { getUserStats, getAllUsers } from "@/lib/sanity-users";
import { getAcademyClient } from "@/lib/academy";
import { requireAdmin } from "@/lib/route-utils";

export async function GET() {
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;
	const academyClient = getAcademyClient();

	const [userStats, onchainCourses, users] = await Promise.all([
		getUserStats(),
		academyClient.fetchAllCourses(),
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
		totalCourses: onchainCourses.length,
		publishedCourses: onchainCourses.filter((course) => course.account.isActive).length,
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
