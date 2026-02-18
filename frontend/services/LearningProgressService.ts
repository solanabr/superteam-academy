import type { PublicKey } from "@solana/web3.js";
import { BaseService } from "./types";
import {
	AcademyClient,
	type CourseAccount,
	type EnrollmentAccount,
	countCompletedLessons,
	isLessonCompleted,
} from "@superteam/anchor";
import { findToken2022ATA } from "@superteam/solana";

export interface CourseProgress {
	courseId: string;
	coursePubkey: PublicKey;
	lessonCount: number;
	completedLessons: number;
	isFinalized: boolean;
	enrolledAt: number;
	completedAt: number | null;
	xpPerLesson: number;
	lessonStates: boolean[];
}

export interface LearnerStats {
	totalXp: bigint;
	enrolledCourses: number;
	completedCourses: number;
	totalLessonsCompleted: number;
}

export class LearningProgressService extends BaseService {
	private client: AcademyClient;

	get academyClient(): AcademyClient {
		if (!this.client) {
			this.client = new AcademyClient(this.connection, this.programId);
		}
		return this.client;
	}

	constructor(...args: ConstructorParameters<typeof BaseService>) {
		super(...args);
		this.client = new AcademyClient(this.connection, this.programId);
	}

	async getCourseProgress(courseId: string, learner: PublicKey): Promise<CourseProgress | null> {
		const [course, enrollment] = await Promise.all([
			this.academyClient.fetchCourse(courseId),
			this.academyClient.fetchEnrollment(courseId, learner),
		]);

		if (!course || !enrollment) return null;

		const completedLessons = countCompletedLessons(enrollment.lessonFlags);
		const lessonStates = Array.from({ length: course.lessonCount }, (_, i) =>
			isLessonCompleted(enrollment.lessonFlags, i)
		);

		return {
			courseId: course.courseId,
			coursePubkey: enrollment.course,
			lessonCount: course.lessonCount,
			completedLessons,
			isFinalized: enrollment.completedAt !== null,
			enrolledAt: enrollment.enrolledAt,
			completedAt: enrollment.completedAt,
			xpPerLesson: course.xpPerLesson,
			lessonStates,
		};
	}

	async getLearnerStats(learner: PublicKey, xpMint: PublicKey): Promise<LearnerStats> {
		const ata = findToken2022ATA(learner, xpMint);
		const [xpBalance, enrollments] = await Promise.all([
			this.academyClient.fetchXpBalance(ata),
			this.academyClient.fetchEnrollmentsForLearner(learner),
		]);

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

	async getAllCourses(): Promise<Array<{ pubkey: PublicKey; account: CourseAccount }>> {
		return this.academyClient.fetchAllCourses();
	}

	async getEnrollment(courseId: string, learner: PublicKey): Promise<EnrollmentAccount | null> {
		return this.academyClient.fetchEnrollment(courseId, learner);
	}
}
