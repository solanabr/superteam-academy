import { Suspense } from "react";
import type { Metadata } from "next";

import { ProfileHeader } from "@/components/profile/profile-header";
import { AchievementGrid } from "@/components/profile/achievement-grid";
import { ProgressStats } from "@/components/profile/progress-stats";
import { ActivityFeed } from "@/components/profile/activity-feed";
import { LevelProgress } from "@/components/profile/level-progress";
import { StreakTracker } from "@/components/profile/streak-tracker";
import { CourseProgress } from "@/components/profile/course-progress";

export const metadata: Metadata = {
	title: "Profile | Superteam Academy",
	description: "View your learning progress, achievements, and statistics",
};

export default async function ProfilePage() {
	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<ProfileSkeleton />}>
				<ProfileContent />
			</Suspense>
		</div>
	);
}

async function ProfileContent() {
	const user = await getCurrentUser();
	const stats = await getUserStats();
	const achievements = await getUserAchievements();
	const activity = await getUserActivity();
	const courses = await getUserCourses();

	return (
		<div className="mx-auto px-4 sm:px-6 py-8 space-y-6">
			<ProfileHeader user={user} stats={stats} />

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<LevelProgress
						currentLevel={stats.level}
						currentXP={stats.xp}
						nextLevelXP={stats.nextLevelXP}
						totalXP={stats.totalXP}
						levelUpHistory={stats.levelHistory}
					/>
					<CourseProgress courses={courses} />
					<AchievementGrid
						achievements={achievements}
						unlockedCount={stats.achievements.unlocked}
						totalCount={stats.achievements.total}
					/>
				</div>

				<div className="space-y-6">
					<StreakTracker streakData={stats.streak} />
					<ProgressStats stats={stats} />
					<ActivityFeed activities={activity} />
				</div>
			</div>
		</div>
	);
}

function ProfileSkeleton() {
	return (
		<div className="mx-auto px-4 sm:px-6 py-8 space-y-6">
			<div className="rounded-2xl border border-border/60 p-6">
				<div className="flex items-center gap-5">
					<div className="h-16 w-16 bg-muted animate-pulse rounded-full" />
					<div className="space-y-2 flex-1">
						<div className="h-5 w-40 bg-muted animate-pulse rounded-lg" />
						<div className="h-4 w-28 bg-muted animate-pulse rounded-lg" />
					</div>
				</div>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					{[120, 180, 220].map((h) => (
						<div key={h} className={`h-[${h}px] bg-muted animate-pulse rounded-2xl`} />
					))}
				</div>
				<div className="space-y-6">
					{[140, 160, 200].map((h) => (
						<div key={h} className={`h-[${h}px] bg-muted animate-pulse rounded-2xl`} />
					))}
				</div>
			</div>
		</div>
	);
}

// Mock data - replace with actual API calls
async function getCurrentUser() {
	return {
		id: "user-1",
		name: "João Silva",
		email: "joao@example.com",
		avatar: "/avatars/joao.jpg",
		bio: "Solana developer passionate about Web3 education",
		joinDate: "2024-01-15",
		location: "São Paulo, Brazil",
		github: "https://github.com/joaosilva",
		linkedin: "https://linkedin.com/in/joaosilva",
		walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAs",
	};
}

async function getUserStats() {
	return {
		level: 12,
		xp: 2450,
		totalXP: 2450,
		nextLevelXP: 550,
		streak: {
			current: 7,
			longest: 23,
			lastActivity: "2024-02-16T10:30:00Z",
			streakHistory: [
				{ date: "2024-02-16", activities: 2, maintained: true },
				{ date: "2024-02-15", activities: 3, maintained: true },
				{ date: "2024-02-14", activities: 1, maintained: true },
				{ date: "2024-02-13", activities: 2, maintained: true },
				{ date: "2024-02-12", activities: 1, maintained: true },
				{ date: "2024-02-11", activities: 2, maintained: true },
				{ date: "2024-02-10", activities: 1, maintained: true },
			],
			weeklyGoal: 14,
			thisWeekActivities: 12,
		},
		courses: {
			completed: 3,
			enrolled: 5,
			inProgress: 2,
		},
		lessons: {
			completed: 32,
			total: 45,
		},
		challenges: {
			completed: 22,
			total: 28,
		},
		achievements: {
			unlocked: 15,
			total: 50,
		},
		timeSpent: {
			today: 120,
			thisWeek: 840,
			total: 1240,
		},
		levelHistory: [
			{ level: 10, achievedAt: "2024-02-01T00:00:00Z", xpAtLevel: 1800 },
			{ level: 11, achievedAt: "2024-02-08T00:00:00Z", xpAtLevel: 2100 },
		],
	};
}

async function getUserAchievements() {
	return [
		{
			id: "first-lesson",
			title: "First Steps",
			description: "Complete your first lesson",
			icon: "book",
			category: "learning" as const,
			rarity: "common" as const,
			xpReward: 50,
			unlockedAt: "2024-01-16T00:00:00Z",
		},
		{
			id: "streak-7",
			title: "Week Warrior",
			description: "Maintain a 7-day learning streak",
			icon: "flame",
			category: "streak" as const,
			rarity: "rare" as const,
			xpReward: 150,
			unlockedAt: "2024-02-10T00:00:00Z",
		},
		{
			id: "first-challenge",
			title: "Code Master",
			description: "Complete your first coding challenge",
			icon: "target",
			category: "completion" as const,
			rarity: "rare" as const,
			xpReward: 200,
			unlockedAt: "2024-01-20T00:00:00Z",
		},
		{
			id: "course-complete",
			title: "Course Conqueror",
			description: "Complete an entire course",
			icon: "trophy",
			category: "completion" as const,
			rarity: "epic" as const,
			xpReward: 500,
			unlockedAt: "2024-02-01T00:00:00Z",
		},
		{
			id: "speed-demon",
			title: "Speed Demon",
			description: "Complete a challenge in under 5 minutes",
			icon: "zap",
			category: "special" as const,
			rarity: "legendary" as const,
			xpReward: 300,
			progress: { current: 0, total: 1 },
		},
		{
			id: "social-butterfly",
			title: "Social Butterfly",
			description: "Help 10 other learners",
			icon: "users",
			category: "social" as const,
			rarity: "epic" as const,
			xpReward: 250,
			progress: { current: 3, total: 10 },
		},
	];
}

async function getUserActivity() {
	return [
		{
			id: "1",
			type: "lesson_completed" as const,
			title: 'Completed "Smart Contract Basics"',
			description: "Finished lesson 3.2 in Solana Fundamentals course",
			timestamp: "2024-02-16T10:30:00Z",
			xpGained: 25,
			metadata: {
				courseName: "Solana Fundamentals",
				lessonName: "Smart Contract Basics",
			},
		},
		{
			id: "2",
			type: "challenge_completed" as const,
			title: 'Solved "Counter Program" challenge',
			description: "Successfully implemented a basic counter program",
			timestamp: "2024-02-16T09:15:00Z",
			xpGained: 100,
			metadata: {
				challengeName: "Counter Program",
			},
		},
		{
			id: "3",
			type: "achievement" as const,
			title: 'Unlocked "Code Master" achievement',
			description: "Earned the Code Master achievement for completing advanced challenges",
			timestamp: "2024-02-15T16:45:00Z",
			xpGained: 200,
			metadata: {
				achievementName: "Code Master",
			},
		},
		{
			id: "4",
			type: "streak" as const,
			title: "7-day learning streak maintained",
			description: "Continued your learning journey for 7 consecutive days",
			timestamp: "2024-02-15T08:00:00Z",
			xpGained: 50,
			metadata: {
				streakDays: 7,
			},
		},
		{
			id: "5",
			type: "level_up" as const,
			title: "Reached Level 12",
			description: "Congratulations on reaching a new level!",
			timestamp: "2024-02-14T14:20:00Z",
			xpGained: 0,
			metadata: {
				level: 12,
			},
		},
	];
}

async function getUserCourses() {
	return [
		{
			id: "solana-fundamentals",
			title: "Solana Fundamentals",
			description: "Learn the basics of Solana blockchain development",
			thumbnail: "/courses/solana-fundamentals.jpg",
			instructor: {
				name: "Maria Santos",
				avatar: "/instructors/maria.jpg",
			},
			progress: {
				completedLessons: 8,
				totalLessons: 12,
				completedChallenges: 5,
				totalChallenges: 8,
				timeSpent: 480,
				lastAccessed: "2024-02-16T10:30:00Z",
			},
			status: "in_progress" as const,
			enrollmentDate: "2024-01-15",
			rating: 4.8,
		},
		{
			id: "anchor-masterclass",
			title: "Anchor Framework Masterclass",
			description: "Master the Anchor framework for Solana programs",
			thumbnail: "/courses/anchor-masterclass.jpg",
			instructor: {
				name: "Carlos Rodriguez",
				avatar: "/instructors/carlos.jpg",
			},
			progress: {
				completedLessons: 15,
				totalLessons: 15,
				completedChallenges: 12,
				totalChallenges: 12,
				timeSpent: 720,
				lastAccessed: "2024-02-10T16:00:00Z",
			},
			status: "completed" as const,
			enrollmentDate: "2024-01-10",
			completionDate: "2024-02-10",
			certificateEarned: true,
			rating: 5.0,
		},
		{
			id: "web3-frontend",
			title: "Web3 Frontend Development",
			description: "Build modern Web3 applications with React and Solana",
			thumbnail: "/courses/web3-frontend.jpg",
			instructor: {
				name: "Ana Costa",
				avatar: "/instructors/ana.jpg",
			},
			progress: {
				completedLessons: 0,
				totalLessons: 10,
				completedChallenges: 0,
				totalChallenges: 6,
				timeSpent: 0,
			},
			status: "not_started" as const,
			enrollmentDate: "2024-02-01",
		},
	];
}
