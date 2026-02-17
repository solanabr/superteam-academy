import type { ChallengeSpec, ChallengeValidationResult } from "./challenge-types";

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_HINTS = 5;
const MAX_TAGS = 10;
const MAX_PREREQUISITES = 5;
const SUPPORTED_LANGUAGES = ["javascript", "typescript", "rust", "python"];
const SUPPORTED_DIFFICULTIES = ["beginner", "intermediate", "advanced"];

export const ChallengeSpecValidator = {
	validate(spec: Partial<ChallengeSpec>): ChallengeValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Required fields validation
		if (!spec.id || typeof spec.id !== "string" || spec.id.trim().length === 0) {
			errors.push("Challenge ID is required and must be a non-empty string");
		}

		if (!spec.title || typeof spec.title !== "string") {
			errors.push("Challenge title is required and must be a string");
		} else if (spec.title.length > MAX_TITLE_LENGTH) {
			errors.push(`Challenge title must be ${MAX_TITLE_LENGTH} characters or less`);
		}

		if (!spec.description || typeof spec.description !== "string") {
			errors.push("Challenge description is required and must be a string");
		} else if (spec.description.length > MAX_DESCRIPTION_LENGTH) {
			errors.push(
				`Challenge description must be ${MAX_DESCRIPTION_LENGTH} characters or less`
			);
		}

		// Language validation
		if (!spec.language || !SUPPORTED_LANGUAGES.includes(spec.language)) {
			errors.push(`Language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}`);
		}

		// Difficulty validation
		if (!spec.difficulty || !SUPPORTED_DIFFICULTIES.includes(spec.difficulty)) {
			errors.push(`Difficulty must be one of: ${SUPPORTED_DIFFICULTIES.join(", ")}`);
		}

		// XP reward validation
		if (typeof spec.xpReward !== "number" || spec.xpReward < 0) {
			errors.push("XP reward must be a non-negative number");
		} else if (spec.xpReward > 1000) {
			warnings.push("XP reward seems unusually high (> 1000)");
		}

		// Time and memory limits
		if (typeof spec.timeLimit !== "number" || spec.timeLimit <= 0) {
			errors.push("Time limit must be a positive number (seconds)");
		} else if (spec.timeLimit > 300) {
			// 5 minutes
			warnings.push("Time limit is very high (> 5 minutes)");
		}

		if (typeof spec.memoryLimit !== "number" || spec.memoryLimit <= 0) {
			errors.push("Memory limit must be a positive number (MB)");
		} else if (spec.memoryLimit > 1024) {
			// 1GB
			warnings.push("Memory limit is very high (> 1GB)");
		}

		// Test cases validation
		if (!spec.testCases || !Array.isArray(spec.testCases)) {
			errors.push("Test cases must be an array");
		} else {
			if (spec.testCases.length === 0) {
				errors.push("At least one test case is required");
			}

			spec.testCases.forEach((testCase, index) => {
				if (!testCase.id) {
					errors.push(`Test case ${index} must have an ID`);
				}
				if (testCase.expectedOutput === undefined) {
					errors.push(`Test case ${index} must have expected output`);
				}
				if (typeof testCase.timeout !== "number" || testCase.timeout <= 0) {
					errors.push(`Test case ${index} must have a positive timeout`);
				}
			});

			// Check for hidden test cases
			const hiddenTests = spec.testCases.filter((tc) => tc.isHidden);
			if (hiddenTests.length === 0) {
				warnings.push("No hidden test cases found - consider adding some for security");
			}
		}

		// Solution template validation
		if (!spec.solutionTemplate || typeof spec.solutionTemplate !== "string") {
			errors.push("Solution template is required and must be a string");
		}

		// Hints validation
		if (spec.hints && Array.isArray(spec.hints)) {
			if (spec.hints.length > MAX_HINTS) {
				errors.push(`Cannot have more than ${MAX_HINTS} hints`);
			}
			spec.hints.forEach((hint, index) => {
				if (typeof hint !== "string") {
					errors.push(`Hint ${index} must be a string`);
				}
			});
		}

		// Tags validation
		if (spec.tags && Array.isArray(spec.tags)) {
			if (spec.tags.length > MAX_TAGS) {
				errors.push(`Cannot have more than ${MAX_TAGS} tags`);
			}
			spec.tags.forEach((tag, index) => {
				if (typeof tag !== "string") {
					errors.push(`Tag ${index} must be a string`);
				}
			});
		}

		// Prerequisites validation
		if (spec.prerequisites && Array.isArray(spec.prerequisites)) {
			if (spec.prerequisites.length > MAX_PREREQUISITES) {
				errors.push(`Cannot have more than ${MAX_PREREQUISITES} prerequisites`);
			}
			spec.prerequisites.forEach((prereq, index) => {
				if (typeof prereq !== "string") {
					errors.push(`Prerequisite ${index} must be a string`);
				}
			});
		}

		// Track validation
		if (!spec.track || typeof spec.track !== "string") {
			errors.push("Track is required and must be a string");
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	},

	sanitizeSpec(spec: Partial<ChallengeSpec>): Partial<ChallengeSpec> {
		const sanitized = { ...spec };

		// Trim strings
		if (sanitized.title) sanitized.title = sanitized.title.trim();
		if (sanitized.description) sanitized.description = sanitized.description.trim();
		if (sanitized.track) sanitized.track = sanitized.track.trim();
		if (sanitized.solutionTemplate)
			sanitized.solutionTemplate = sanitized.solutionTemplate.trim();

		// Sanitize arrays
		if (sanitized.hints) {
			sanitized.hints = sanitized.hints
				.filter((hint) => typeof hint === "string" && hint.trim().length > 0)
				.map((hint) => hint.trim())
				.slice(0, MAX_HINTS);
		}

		if (sanitized.tags) {
			sanitized.tags = sanitized.tags
				.filter((tag) => typeof tag === "string" && tag.trim().length > 0)
				.map((tag) => tag.trim().toLowerCase())
				.slice(0, MAX_TAGS);
		}

		if (sanitized.prerequisites) {
			sanitized.prerequisites = sanitized.prerequisites
				.filter((prereq) => typeof prereq === "string" && prereq.trim().length > 0)
				.map((prereq) => prereq.trim())
				.slice(0, MAX_PREREQUISITES);
		}

		return sanitized;
	},
};
