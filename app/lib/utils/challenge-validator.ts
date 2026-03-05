/**
 * @fileoverview Shared utility for semantic validation of Rust/Solana code.
 * Used by both Daily Challenges and Lesson Challenges.
 */

export interface ValidationResult {
	passed: boolean;
	errorMessage: string;
	ratios: {
		length: number;
		token: number;
	};
	missingStructures: string[];
}

const COMMON_RUST_TOKENS = new Set([
	"pub",
	"fn",
	"mut",
	"let",
	"match",
	"if",
	"else",
	"return",
	"use",
	"mod",
	"struct",
	"enum",
	"impl",
]);

const STRUCTURAL_PATTERNS = [
	{ name: "initialize", pattern: /fn\s+initialize/i },
	{ name: "execute", pattern: /fn\s+execute/i },
	{ name: "State", pattern: /struct\s+State/i },
	{ name: "Instruction", pattern: /enum\s+Instruction/i },
	{ name: "Program", pattern: /#\[program\]/i },
	{ name: "Account", pattern: /#\[account\]/i },
	{ name: "Derive", pattern: /#\[derive/i },
];

/**
 * Performs a multi-layered semantic check of user code against a solution.
 */
export function validateChallengeCode(
	userCode: string,
	solutionCode: string,
	starterCode: string,
): ValidationResult {
	const userCleaned = userCode.trim();
	const starterCleaned = starterCode.trim();
	const solutionCleaned = solutionCode.trim();

	// 1. Basic Change Check
	const hasChanged = userCleaned.length > 0 && userCleaned !== starterCleaned;

	if (!hasChanged) {
		return {
			passed: false,
			errorMessage: "No changes detected from starter template.",
			ratios: { length: 0, token: 0 },
			missingStructures: [],
		};
	}

	// 2. Structural Analysis (Missing critical pieces)
	const missingStructures = STRUCTURAL_PATTERNS.filter(
		(p) => solutionCleaned.match(p.pattern) && !userCode.match(p.pattern),
	).map((p) => p.name);

	// 3. Token Density Check (Semantic Similarity)
	const solutionTokens = Array.from(
		new Set(
			solutionCleaned
				.split(/[\s\(\)\{\}\[\]\.\,\:\;]/)
				.map((t) => t.trim())
				.filter(
					(t) => t.length > 4 && !COMMON_RUST_TOKENS.has(t.toLowerCase()),
				),
		),
	);

	const userCodeLower = userCode.toLowerCase();
	const matchedTokens = solutionTokens.filter((t) =>
		userCodeLower.includes(t.toLowerCase()),
	);

	const lengthRatio =
		solutionCleaned.length > 0 ? userCode.length / solutionCleaned.length : 1;
	const tokenRatio =
		solutionTokens.length > 0
			? matchedTokens.length / solutionTokens.length
			: 1;

	// 4. Determine Pass/Fail based on granular criteria
	let errorMessage = "";
	if (missingStructures.length > 0) {
		errorMessage = `Missing required structure(s): ${missingStructures.join(", ")}.`;
	} else if (lengthRatio < 0.3) {
		errorMessage = "Implementation is significantly shorter than expected.";
	} else if (tokenRatio < 0.35) {
		errorMessage = "Missing essential logic or variables from the solution.";
	}

	return {
		passed: !errorMessage,
		errorMessage,
		ratios: {
			length: lengthRatio,
			token: tokenRatio,
		},
		missingStructures,
	};
}
