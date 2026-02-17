import { describe, it, expect } from "vitest";
import { TestDataFactory } from "../factories";

describe("TestDataFactory", () => {
	describe("user", () => {
		it("should generate a valid user object", () => {
			const user = TestDataFactory.user();

			expect(user).toHaveProperty("id");
			expect(user).toHaveProperty("email");
			expect(user).toHaveProperty("name");
			expect(user).toHaveProperty("avatar");
			expect(user).toHaveProperty("preferences");
			expect(user).toHaveProperty("stats");
			expect(typeof user.id).toBe("string");
			expect(user.email).toContain("@");
		});

		it("should override default values", () => {
			const customUser = TestDataFactory.user({
				name: "Custom Name",
				email: "custom@example.com",
			});

			expect(customUser.name).toBe("Custom Name");
			expect(customUser.email).toBe("custom@example.com");
		});
	});

	describe("course", () => {
		it("should generate a valid course object", () => {
			const course = TestDataFactory.course();

			expect(course).toHaveProperty("id");
			expect(course).toHaveProperty("title");
			expect(course).toHaveProperty("description");
			expect(course).toHaveProperty("instructor");
			expect(course).toHaveProperty("level");
			expect(course).toHaveProperty("tags");
			expect(course).toHaveProperty("duration");
			expect(course.duration).toBeGreaterThan(0);
			expect(["beginner", "intermediate", "advanced"]).toContain(course.level);
		});

		it("should generate courses with proper relationships", () => {
			const course = TestDataFactory.course();
			const lessons = TestDataFactory.lessons(5, course.id);

			expect(lessons).toHaveLength(5);
			lessons.forEach((lesson) => {
				expect(lesson.courseId).toBe(course.id);
				expect(lesson.order).toBeGreaterThan(0);
			});
		});
	});

	describe("lesson", () => {
		it("should generate a valid lesson object", () => {
			const lesson = TestDataFactory.lesson();

			expect(lesson).toHaveProperty("id");
			expect(lesson).toHaveProperty("title");
			expect(lesson).toHaveProperty("description");
			expect(lesson).toHaveProperty("type");
			expect(lesson).toHaveProperty("duration");
			expect(lesson).toHaveProperty("order");
			expect(lesson).toHaveProperty("content");
			expect(["video", "text", "quiz", "interactive", "assignment"]).toContain(lesson.type);
		});
	});

	describe("challenge", () => {
		it("should generate a valid challenge object", () => {
			const challenge = TestDataFactory.challenge();

			expect(challenge).toHaveProperty("id");
			expect(challenge).toHaveProperty("title");
			expect(challenge).toHaveProperty("description");
			expect(challenge).toHaveProperty("difficulty");
			expect(challenge).toHaveProperty("language");
			expect(challenge).toHaveProperty("xpReward");
			expect(challenge).toHaveProperty("testCases");
			expect(["easy", "medium", "hard", "expert"]).toContain(challenge.difficulty);
			expect(["typescript", "javascript", "rust", "solidity", "python"]).toContain(
				challenge.language
			);
			expect(challenge.testCases.length).toBeGreaterThan(0);
		});
	});

	describe("achievement", () => {
		it("should generate a valid achievement object", () => {
			const achievement = TestDataFactory.achievement();

			expect(achievement).toHaveProperty("id");
			expect(achievement).toHaveProperty("title");
			expect(achievement).toHaveProperty("description");
			expect(achievement).toHaveProperty("icon");
			expect(achievement).toHaveProperty("category");
			expect(achievement).toHaveProperty("rarity");
			expect(achievement).toHaveProperty("xpReward");
			expect(["common", "uncommon", "rare", "epic", "legendary"]).toContain(
				achievement.rarity
			);
		});
	});

	describe("enrollment", () => {
		it("should generate a valid enrollment object", () => {
			const enrollment = TestDataFactory.enrollment();

			expect(enrollment).toHaveProperty("id");
			expect(enrollment).toHaveProperty("userId");
			expect(enrollment).toHaveProperty("courseId");
			expect(enrollment).toHaveProperty("status");
			expect(enrollment).toHaveProperty("progress");
			expect(["enrolled", "in_progress", "completed", "dropped"]).toContain(
				enrollment.status
			);
			expect(enrollment.progress).toBeGreaterThanOrEqual(0);
			expect(enrollment.progress).toBeLessThanOrEqual(100);
		});
	});

	describe("wallet", () => {
		it("should generate a valid wallet object", () => {
			const wallet = TestDataFactory.wallet();

			expect(wallet).toHaveProperty("publicKey");
			expect(wallet).toHaveProperty("connected");
			expect(wallet).toHaveProperty("balance");
			expect(wallet.balance).toHaveProperty("sol");
			expect(wallet.balance).toHaveProperty("tokens");
			expect(typeof wallet.publicKey).toBe("string");
			expect(wallet.publicKey.length).toBe(44); // Solana public key length
		});
	});

	describe("bulk generators", () => {
		it("should generate multiple users", () => {
			const users = TestDataFactory.users(3);

			expect(users).toHaveLength(3);
			users.forEach((user) => {
				expect(user).toHaveProperty("id");
				expect(user).toHaveProperty("email");
			});
		});

		it("should generate multiple courses", () => {
			const courses = TestDataFactory.courses(2);

			expect(courses).toHaveLength(2);
			courses.forEach((course) => {
				expect(course).toHaveProperty("id");
				expect(course).toHaveProperty("title");
			});
		});

		it("should generate lessons for a course", () => {
			const courseId = "test-course-id";
			const lessons = TestDataFactory.lessons(3, courseId);

			expect(lessons).toHaveLength(3);
			lessons.forEach((lesson, index) => {
				expect(lesson.courseId).toBe(courseId);
				expect(lesson.order).toBe(index + 1);
			});
		});
	});
});
