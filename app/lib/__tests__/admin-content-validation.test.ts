import { describe, expect, it } from "vitest";

import { parseChallengePayload, parseQuizPayload } from "@/lib/admin-content-validation";

describe("admin content payload validation", () => {
	it("accepts a valid challenge payload", () => {
		const parsed = parseChallengePayload({
			title: "Counter Challenge",
			description: "Build a counter",
			difficulty: "beginner",
			estimatedTime: "30 min",
			xpReward: 120,
			language: "rust",
			starterCode: "fn main() {}",
			instructions: [{ title: "Step 1", content: "Initialize" }],
			objectives: ["Pass tests"],
			tests: [{ id: "t1", description: "Compiles", type: "unit" }],
			hints: [{ content: "Use checked_add", cost: 5 }],
			published: true,
		});

		expect(parsed).not.toBeNull();
		expect(parsed?.tests[0]?.type).toBe("unit");
	});

	it("rejects invalid challenge difficulty", () => {
		const parsed = parseChallengePayload({
			title: "Counter Challenge",
			description: "Build a counter",
			difficulty: "expert",
			estimatedTime: "30 min",
			xpReward: 120,
			language: "rust",
			starterCode: "fn main() {}",
			instructions: [],
			objectives: [],
			tests: [],
			hints: [],
			published: false,
		});

		expect(parsed).toBeNull();
	});

	it("accepts a valid quiz payload", () => {
		const parsed = parseQuizPayload({
			title: "Lesson Quiz",
			passingScore: 80,
			published: true,
			questions: [
				{
					id: "q1",
					prompt: "What is a PDA?",
					options: [
						{ id: "a", text: "Program Derived Address" },
						{ id: "b", text: "Public Data Account" },
					],
					correctOptionId: "a",
					explanation: "Derived with seeds and program id",
				},
			],
		});

		expect(parsed).not.toBeNull();
		expect(parsed?.questions[0]?.correctOptionId).toBe("a");
	});

	it("rejects quiz question with invalid correct option", () => {
		const parsed = parseQuizPayload({
			title: "Lesson Quiz",
			passingScore: 80,
			published: true,
			questions: [
				{
					id: "q1",
					prompt: "What is a PDA?",
					options: [
						{ id: "a", text: "Program Derived Address" },
						{ id: "b", text: "Public Data Account" },
					],
					correctOptionId: "z",
				},
			],
		});

		expect(parsed).toBeNull();
	});
});
