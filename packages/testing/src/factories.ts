import { faker } from "@faker-js/faker";

// Factory functions for generating test data
export const TestDataFactory = {
	user(overrides = {}) {
		return {
			id: faker.string.uuid(),
			email: faker.internet.email(),
			name: faker.person.fullName(),
			avatar: faker.image.avatar(),
			bio: faker.lorem.sentence(),
			location: faker.location.city(),
			website: faker.internet.url(),
			githubUsername: faker.internet.username(),
			twitterHandle: faker.internet.username(),
			linkedinProfile: faker.internet.url(),
			createdAt: faker.date.past(),
			updatedAt: faker.date.recent(),
			preferences: {
				theme: faker.helpers.arrayElement(["light", "dark", "system"]),
				language: faker.helpers.arrayElement(["en", "pt", "es"]),
				notifications: faker.datatype.boolean(),
				emailUpdates: faker.datatype.boolean(),
			},
			stats: {
				coursesCompleted: faker.number.int({ min: 0, max: 50 }),
				lessonsCompleted: faker.number.int({ min: 0, max: 200 }),
				totalXp: faker.number.int({ min: 0, max: 10_000 }),
				streakDays: faker.number.int({ min: 0, max: 365 }),
			},
			...overrides,
		};
	},

	course(overrides = {}) {
		const levels = ["beginner", "intermediate", "advanced"] as const;
		const tags = [
			"javascript",
			"typescript",
			"react",
			"solana",
			"blockchain",
			"web3",
			"rust",
			"smart-contracts",
		];

		return {
			id: faker.string.uuid(),
			title: faker.lorem.words({ min: 3, max: 8 }),
			description: faker.lorem.paragraphs(2),
			shortDescription: faker.lorem.sentence(),
			instructor: faker.person.fullName(),
			instructorBio: faker.lorem.paragraph(),
			instructorAvatar: faker.image.avatar(),
			duration: faker.number.int({ min: 1800, max: 28_800 }), // 30min to 8hrs
			level: faker.helpers.arrayElement(levels),
			tags: faker.helpers.arrayElements(tags, { min: 1, max: 4 }),
			prerequisites: faker.helpers.arrayElements(
				["Basic JavaScript", "HTML/CSS", "React Basics", "TypeScript"],
				{ min: 0, max: 2 }
			),
			learningOutcomes: faker.helpers.arrayElements(
				[
					"Build decentralized applications",
					"Understand blockchain concepts",
					"Deploy smart contracts",
					"Create web3 interfaces",
				],
				{ min: 3, max: 6 }
			),
			thumbnail: faker.image.url(),
			videoPreview: faker.internet.url(),
			enrollmentCount: faker.number.int({ min: 0, max: 10_000 }),
			rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
			reviewCount: faker.number.int({ min: 0, max: 500 }),
			price: faker.number.int({ min: 0, max: 500 }),
			currency: "USD",
			isFree: faker.datatype.boolean(),
			isPublished: faker.datatype.boolean(),
			createdAt: faker.date.past(),
			updatedAt: faker.date.recent(),
			publishedAt: faker.date.recent(),
			...overrides,
		};
	},

	lesson(overrides = {}) {
		const types = ["video", "text", "quiz", "interactive", "assignment"] as const;

		return {
			id: faker.string.uuid(),
			courseId: faker.string.uuid(),
			title: faker.lorem.words({ min: 4, max: 10 }),
			description: faker.lorem.paragraph(),
			type: faker.helpers.arrayElement(types),
			duration: faker.number.int({ min: 300, max: 3600 }), // 5min to 1hr
			order: faker.number.int({ min: 1, max: 50 }),
			content: faker.lorem.paragraphs(5),
			videoUrl: faker.internet.url(),
			videoDuration: faker.number.int({ min: 300, max: 3600 }),
			resources: faker.helpers.arrayElements(
				[
					{
						type: "link" as const,
						title: faker.lorem.words(3),
						url: faker.internet.url(),
						description: faker.lorem.sentence(),
					},
					{
						type: "file" as const,
						title: faker.lorem.words(2),
						url: faker.internet.url(),
						size: faker.number.int({ min: 1000, max: 10_000_000 }),
						mimeType: "application/pdf",
					},
				],
				{ min: 0, max: 3 }
			),
			quiz: {
				questions: faker.helpers.arrayElements(
					[
						{
							id: faker.string.uuid(),
							question: faker.lorem.sentence(),
							type: "multiple-choice" as const,
							options: faker.helpers.arrayElements(
								["Option A", "Option B", "Option C", "Option D"],
								4
							),
							correctAnswer: faker.number.int({ min: 0, max: 3 }),
							explanation: faker.lorem.sentence(),
						},
						{
							id: faker.string.uuid(),
							question: faker.lorem.sentence(),
							type: "true-false" as const,
							options: ["True", "False"],
							correctAnswer: faker.number.int({ min: 0, max: 1 }),
							explanation: faker.lorem.sentence(),
						},
					],
					{ min: 0, max: 5 }
				),
			},
			isPreview: faker.datatype.boolean(),
			isLocked: faker.datatype.boolean(),
			xpReward: faker.number.int({ min: 5, max: 50 }),
			createdAt: faker.date.past(),
			updatedAt: faker.date.recent(),
			...overrides,
		};
	},

	challenge(overrides = {}) {
		const difficulties = ["easy", "medium", "hard", "expert"] as const;
		const languages = ["typescript", "javascript", "rust", "solidity", "python"] as const;

		return {
			id: faker.string.uuid(),
			courseId: faker.string.uuid(),
			lessonId: faker.string.uuid(),
			title: faker.lorem.words({ min: 5, max: 12 }),
			description: faker.lorem.paragraphs(2),
			difficulty: faker.helpers.arrayElement(difficulties),
			language: faker.helpers.arrayElement(languages),
			xpReward: faker.number.int({ min: 10, max: 200 }),
			timeLimit: faker.number.int({ min: 600, max: 7200 }), // 10min to 2hrs
			starterCode: `// ${faker.lorem.sentence()}\n\nfunction solution() {\n  // Your code here\n}\n`,
			testCases: faker.helpers.arrayElements(
				[
					{
						id: faker.string.uuid(),
						input: { value: faker.number.int({ min: 1, max: 100 }) },
						expected: faker.number.int({ min: 1, max: 100 }),
						description: faker.lorem.sentence(),
						isHidden: false,
					},
					{
						id: faker.string.uuid(),
						input: { array: faker.helpers.arrayElements([1, 2, 3, 4, 5], 3) },
						expected: faker.number.int({ min: 1, max: 100 }),
						description: faker.lorem.sentence(),
						isHidden: true,
					},
				],
				{ min: 3, max: 8 }
			),
			hints: faker.helpers.arrayElements(
				[faker.lorem.sentence(), faker.lorem.sentence(), faker.lorem.sentence()],
				{ min: 0, max: 3 }
			),
			solution: `// Solution\nfunction solution() {\n  // Implementation here\n  return ${faker.number.int()};\n}`,
			isPublished: faker.datatype.boolean(),
			createdAt: faker.date.past(),
			updatedAt: faker.date.recent(),
			...overrides,
		};
	},

	achievement(overrides = {}) {
		const rarities = ["common", "uncommon", "rare", "epic", "legendary"] as const;
		const categories = ["learning", "social", "technical", "completion", "streak"] as const;

		return {
			id: faker.string.uuid(),
			title: faker.lorem.words({ min: 2, max: 5 }),
			description: faker.lorem.sentence(),
			icon: faker.helpers.arrayElement(["🏆", "⭐", "🎯", "🔥", "💎", "🚀", "🎨", "⚡"]),
			category: faker.helpers.arrayElement(categories),
			rarity: faker.helpers.arrayElement(rarities),
			xpReward: faker.number.int({ min: 5, max: 100 }),
			criteria: {
				type: faker.helpers.arrayElement([
					"lesson_complete",
					"course_complete",
					"streak",
					"challenge_solve",
					"social_share",
				]),
				value: faker.number.int({ min: 1, max: 100 }),
			},
			isActive: faker.datatype.boolean(),
			createdAt: faker.date.past(),
			...overrides,
		};
	},

	enrollment(overrides = {}) {
		const statuses = ["enrolled", "in_progress", "completed", "dropped"] as const;

		return {
			id: faker.string.uuid(),
			userId: faker.string.uuid(),
			courseId: faker.string.uuid(),
			status: faker.helpers.arrayElement(statuses),
			progress: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
			completedLessons: faker.helpers.arrayElements(
				Array.from({ length: 20 }, (_, i) => `lesson-${i + 1}`),
				{ min: 0, max: 20 }
			),
			currentLesson: `lesson-${faker.number.int({ min: 1, max: 20 })}`,
			startedAt: faker.date.past(),
			completedAt: faker.datatype.boolean() ? faker.date.recent() : null,
			lastAccessedAt: faker.date.recent(),
			timeSpent: faker.number.int({ min: 0, max: 86_400 }), // up to 24hrs
			...overrides,
		};
	},

	wallet(overrides = {}) {
		return {
			publicKey: faker.string.alphanumeric(44), // Solana public key length
			connected: faker.datatype.boolean(),
			balance: {
				sol: faker.number.float({ min: 0, max: 100, fractionDigits: 3 }),
				tokens: faker.helpers.arrayElements(
					[
						{
							mint: faker.string.alphanumeric(44),
							amount: faker.number.int({ min: 0, max: 1_000_000 }),
							symbol: faker.helpers.arrayElement(["USDC", "SOL", "BONK", "RAY"]),
							decimals: 6,
							name: faker.lorem.words(2),
						},
					],
					{ min: 0, max: 5 }
				),
			},
			nfts: faker.helpers.arrayElements(
				[
					{
						mint: faker.string.alphanumeric(44),
						name: faker.lorem.words(3),
						image: faker.image.url(),
						collection: faker.lorem.words(2),
					},
				],
				{ min: 0, max: 10 }
			),
			...overrides,
		};
	},

	// Bulk generators
	users(count: number, overrides = {}) {
		return Array.from({ length: count }, () => TestDataFactory.user(overrides));
	},

	courses(count: number, overrides = {}) {
		return Array.from({ length: count }, () => TestDataFactory.course(overrides));
	},

	lessons(count: number, courseId?: string, overrides = {}) {
		return Array.from({ length: count }, (_, index) =>
			TestDataFactory.lesson({
				courseId,
				order: index + 1,
				...overrides,
			})
		);
	},

	challenges(count: number, courseId?: string, lessonId?: string, overrides = {}) {
		return Array.from({ length: count }, () =>
			TestDataFactory.challenge({
				courseId,
				lessonId,
				...overrides,
			})
		);
	},
};
