import type { PublicKey } from "@solana/web3.js";
import { BaseService } from "./types";
import { AcademyClient, countCompletedLessons } from "@superteam-academy/anchor";
import { findToken2022ATA } from "@superteam-academy/solana";
import { AchievementService } from "./achievement-service";

export interface LearnerStats {
	totalXp: bigint;
	enrolledCourses: number;
	completedCourses: number;
	totalLessonsCompleted: number;
}

export interface LearnerCourseSummary {
	courseId: string;
	coursePubkey: PublicKey;
	totalLessons: number;
	completedLessons: number;
	xpPerLesson: number;
	xpEarned: number;
	isFinalized: boolean;
	enrolledAt: number;
	completedAt: number | null;
}

export interface LearnerOverview {
	stats: LearnerStats;
	courses: LearnerCourseSummary[];
	achievementsUnlocked: number;
	recommendedCourses: Array<{ id: string; title: string; lessonCount: number }>;
}

export interface LearnerProgressSnapshot {
	totalXp: number;
	courses: Array<{
		courseId: string;
		courseTitle: string;
		totalLessons: number;
		completedLessons: number;
		xpEarned: number;
		timeSpent: number;
		lastActivity: Date;
	}>;
	achievements: Array<{
		id: string;
		title: string;
		description: string;
		icon: string;
		unlockedAt: Date;
		rarity: "common" | "rare" | "epic" | "legendary";
	}>;
}

export class LearningProgressService extends BaseService {
	private client: AcademyClient;
	private achievementService: AchievementService;

	get academyClient(): AcademyClient {
		return this.client;
	}

	constructor(...args: ConstructorParameters<typeof BaseService>) {
		super(...args);
		this.client = new AcademyClient(this.connection, this.programId);
		this.achievementService = new AchievementService(this.connection, this.programId);
	}

	async getLearnerStats(learner: PublicKey, xpMint: PublicKey | null): Promise<LearnerStats> {
		const enrollments = await this.academyClient.fetchEnrollmentsForLearner(learner);
		const xpBalance = xpMint
			? await this.academyClient.fetchXpBalance(findToken2022ATA(learner, xpMint))
			: 0n;

		let totalLessonsCompleted = 0;
		let completedCourses = 0;
		for (const { account } of enrollments) {
			totalLessonsCompleted += countCompletedLessons(account.lessonFlags);
			if (account.completedAt !== null) completedCourses++;
		}

		return {
			totalXp: xpBalance ?? 0n,
			enrolledCourses: enrollments.length,
			completedCourses,
			totalLessonsCompleted,
		};
	}

	async getLearnerOverview(learner: PublicKey): Promise<LearnerOverview> {
		const [config, allCourses, enrollments, allAchievements] = await Promise.all([
			this.academyClient.fetchConfig(),
			this.academyClient.fetchAllCourses(),
			this.academyClient.fetchEnrollmentsForLearner(learner),
			this.achievementService.getLearnerAchievements(learner),
		]);

		const stats = await this.getLearnerStats(learner, config?.xpMint ?? null);
		const coursesByKey = new Map(
			allCourses.map((course) => [course.pubkey.toBase58(), course])
		);

		const courses = enrollments.map((entry) => {
			const matched = coursesByKey.get(entry.account.course.toBase58());
			const account = matched?.account;
			const completedLessons = countCompletedLessons(entry.account.lessonFlags);
			const totalLessons = account?.lessonCount ?? 0;
			const xpPerLesson = account?.xpPerLesson ?? 0;

			return {
				courseId: account?.courseId ?? entry.pubkey.toBase58(),
				coursePubkey: entry.account.course,
				totalLessons,
				completedLessons,
				xpPerLesson,
				xpEarned: completedLessons * xpPerLesson,
				isFinalized: entry.account.completedAt !== null,
				enrolledAt: entry.account.enrolledAt,
				completedAt: entry.account.completedAt,
			};
		});

		const enrolledCourseKeys = new Set(
			enrollments.map((entry) => entry.account.course.toBase58())
		);
		const recommendedCourses = allCourses
			.filter(
				(course) =>
					!enrolledCourseKeys.has(course.pubkey.toBase58()) && course.account.isActive
			)
			.slice(0, 3)
			.map((course) => ({
				id: course.account.courseId,
				title: course.account.courseId,
				lessonCount: course.account.lessonCount,
			}));

		const achievementsUnlocked = allAchievements.filter(
			(achievement) => achievement.earned
		).length;

		return {
			stats,
			courses,
			achievementsUnlocked,
			recommendedCourses,
		};
	}

	async getLearnerProgressSnapshot(learner: PublicKey): Promise<LearnerProgressSnapshot> {
		const overview = await this.getLearnerOverview(learner);
		const rawAchievements = await this.achievementService.getLearnerAchievements(learner);

		return {
			totalXp: Number(overview.stats.totalXp),
			courses: overview.courses.map((course) => ({
				courseId: course.courseId,
				courseTitle: course.courseId,
				totalLessons: course.totalLessons,
				completedLessons: course.completedLessons,
				xpEarned: course.xpEarned,
				timeSpent: course.completedLessons * 10,
				lastActivity: new Date(course.enrolledAt * 1000),
			})),
			achievements: rawAchievements
				.filter((achievement) => achievement.earned && achievement.awardedAt)
				.map((achievement) => ({
					id: achievement.achievementId,
					title: achievement.name,
					description: achievement.metadataUri,
					icon: "trophy",
					unlockedAt: new Date((achievement.awardedAt as number) * 1000),
					rarity: "common" as const,
				})),
		};
	}
}
