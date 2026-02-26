import type {
	ChallengePayload,
	QuizPayload,
	ChallengeInstruction,
	ChallengeTest,
	ChallengeHint,
	QuizQuestion,
	QuizQuestionOption,
} from "@/lib/challenge-content";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function asNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function asBoolean(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null;
}

function asNumber(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseInstruction(value: unknown): ChallengeInstruction | null {
	if (!isRecord(value)) return null;
	const title = asNonEmptyString(value.title);
	const content = asNonEmptyString(value.content);
	if (!title || !content) return null;
	return { title, content };
}

function parseTest(value: unknown): ChallengeTest | null {
	if (!isRecord(value)) return null;
	const id = asNonEmptyString(value.id);
	const description = asNonEmptyString(value.description);
	const type = value.type;
	if (!id || !description) return null;
	if (type !== "unit" && type !== "integration") return null;
	return { id, description, type };
}

function parseHint(value: unknown): ChallengeHint | null {
	if (!isRecord(value)) return null;
	const content = asNonEmptyString(value.content);
	const cost = asNumber(value.cost);
	if (!content || cost === null || cost < 0) return null;
	return { content, cost: Math.floor(cost) };
}

function parseOption(value: unknown): QuizQuestionOption | null {
	if (!isRecord(value)) return null;
	const id = asNonEmptyString(value.id);
	const text = asNonEmptyString(value.text);
	if (!id || !text) return null;
	return { id, text };
}

function parseQuestion(value: unknown): QuizQuestion | null {
	if (!isRecord(value)) return null;
	const id = asNonEmptyString(value.id);
	const prompt = asNonEmptyString(value.prompt);
	const correctOptionId = asNonEmptyString(value.correctOptionId);
	if (!id || !prompt || !correctOptionId) return null;

	if (!Array.isArray(value.options)) return null;
	const options: QuizQuestionOption[] = [];
	for (const option of value.options) {
		const parsed = parseOption(option);
		if (!parsed) return null;
		options.push(parsed);
	}

	if (options.length < 2) return null;
	if (!options.some((option) => option.id === correctOptionId)) return null;

	const explanation =
		typeof value.explanation === "string" ? value.explanation.trim() || undefined : undefined;

	return {
		id,
		prompt,
		options,
		correctOptionId,
		explanation,
	};
}

export function parseChallengePayload(input: unknown): ChallengePayload | null {
	if (!isRecord(input)) return null;

	const title = asNonEmptyString(input.title);
	const description = typeof input.description === "string" ? input.description.trim() : "";
	const difficulty = input.difficulty;
	const estimatedTime = asNonEmptyString(input.estimatedTime);
	const xpReward = asNumber(input.xpReward);
	const language = asNonEmptyString(input.language);
	const starterCode = typeof input.starterCode === "string" ? input.starterCode : null;
	const published = asBoolean(input.published);

	if (
		!title ||
		!estimatedTime ||
		xpReward === null ||
		xpReward < 0 ||
		!language ||
		starterCode === null ||
		published === null
	) {
		return null;
	}

	if (difficulty !== "beginner" && difficulty !== "intermediate" && difficulty !== "advanced") {
		return null;
	}

	if (!Array.isArray(input.instructions) || !Array.isArray(input.objectives)) return null;
	if (!Array.isArray(input.tests) || !Array.isArray(input.hints)) return null;

	const instructions: ChallengeInstruction[] = [];
	for (const instruction of input.instructions) {
		const parsed = parseInstruction(instruction);
		if (!parsed) return null;
		instructions.push(parsed);
	}

	const objectives: string[] = [];
	for (const objective of input.objectives) {
		const parsed = asNonEmptyString(objective);
		if (!parsed) return null;
		objectives.push(parsed);
	}

	const tests: ChallengeTest[] = [];
	for (const test of input.tests) {
		const parsed = parseTest(test);
		if (!parsed) return null;
		tests.push(parsed);
	}

	const hints: ChallengeHint[] = [];
	for (const hint of input.hints) {
		const parsed = parseHint(hint);
		if (!parsed) return null;
		hints.push(parsed);
	}

	return {
		title,
		description,
		difficulty,
		estimatedTime,
		xpReward: Math.floor(xpReward),
		language,
		starterCode,
		instructions,
		objectives,
		tests,
		hints,
		published,
	};
}

export function parseQuizPayload(input: unknown): QuizPayload | null {
	if (!isRecord(input)) return null;

	const title = asNonEmptyString(input.title);
	const passingScore = asNumber(input.passingScore);
	const published = asBoolean(input.published);
	if (
		!title ||
		passingScore === null ||
		passingScore < 0 ||
		passingScore > 100 ||
		published === null
	) {
		return null;
	}

	if (!Array.isArray(input.questions)) return null;
	const questions: QuizQuestion[] = [];
	for (const question of input.questions) {
		const parsed = parseQuestion(question);
		if (!parsed) return null;
		questions.push(parsed);
	}

	return {
		title,
		passingScore: Math.floor(passingScore),
		questions,
		published,
	};
}
