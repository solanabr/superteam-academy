export interface CodeQualityMetrics {
	cyclomaticComplexity: number;
	maintainabilityIndex: number;
	linesOfCode: number;
	commentRatio: number;
	functionCount: number;
	averageFunctionLength: number;
	maxFunctionLength: number;
	duplicateCodeRatio: number;
	namingConventionScore: number;
	errorHandlingScore: number;
	testabilityScore: number;
	overallScore: number;
}

export interface CodeQualityReport {
	metrics: CodeQualityMetrics;
	issues: CodeQualityIssue[];
	suggestions: string[];
	grade: "A" | "B" | "C" | "D" | "F";
}

export interface CodeQualityIssue {
	type:
		| "complexity"
		| "readability"
		| "maintainability"
		| "convention"
		| "performance"
		| "security";
	severity: "low" | "medium" | "high" | "critical";
	line?: number;
	message: string;
	suggestion: string;
}

export class CodeQualityAnalyzer {
	private static readonly COMPLEXITY_THRESHOLDS = {
		excellent: 5,
		good: 10,
		fair: 20,
		poor: 30,
	};

	private static readonly MAINTAINABILITY_THRESHOLDS = {
		excellent: 85,
		good: 70,
		fair: 55,
		poor: 40,
	};

	private static readonly FUNCTION_LENGTH_THRESHOLDS = {
		excellent: 15,
		good: 25,
		fair: 40,
		poor: 60,
	};

	analyzeCode(code: string, language = "javascript"): CodeQualityReport {
		const metrics = this.calculateMetrics(code, language);
		const issues = this.identifyIssues(code, language, metrics);
		const suggestions = this.generateSuggestions(issues, metrics);
		const grade = this.calculateGrade(metrics);

		return {
			metrics,
			issues,
			suggestions,
			grade,
		};
	}

	private calculateMetrics(code: string, language: string): CodeQualityMetrics {
		const lines = code.split("\n").filter((line) => line.trim().length > 0);
		const linesOfCode = lines.length;

		// Cyclomatic complexity
		const cyclomaticComplexity = this.calculateCyclomaticComplexity(code, language);

		// Maintainability index (simplified)
		const maintainabilityIndex = this.calculateMaintainabilityIndex(
			linesOfCode,
			cyclomaticComplexity
		);

		// Comment ratio
		const commentLines = lines.filter((line) => this.isCommentLine(line, language)).length;
		const commentRatio = linesOfCode > 0 ? commentLines / linesOfCode : 0;

		// Function analysis
		const functions = this.extractFunctions(code, language);
		const functionCount = functions.length;
		const functionLengths = functions.map((f) => f.lines.length);
		const averageFunctionLength =
			functionLengths.length > 0
				? functionLengths.reduce((a, b) => a + b, 0) / functionLengths.length
				: 0;
		const maxFunctionLength = functionLengths.length > 0 ? Math.max(...functionLengths) : 0;

		// Duplicate code ratio (simplified)
		const duplicateCodeRatio = this.calculateDuplicateCodeRatio(lines);

		// Naming convention score
		const namingConventionScore = this.calculateNamingConventionScore(code, language);

		// Error handling score
		const errorHandlingScore = this.calculateErrorHandlingScore(code, language);

		// Testability score
		const testabilityScore = this.calculateTestabilityScore(code, language);

		// Overall score (weighted average)
		const overallScore = this.calculateOverallScore({
			cyclomaticComplexity,
			maintainabilityIndex,
			commentRatio,
			averageFunctionLength,
			duplicateCodeRatio,
			namingConventionScore,
			errorHandlingScore,
			testabilityScore,
		});

		return {
			cyclomaticComplexity,
			maintainabilityIndex,
			linesOfCode,
			commentRatio,
			functionCount,
			averageFunctionLength,
			maxFunctionLength,
			duplicateCodeRatio,
			namingConventionScore,
			errorHandlingScore,
			testabilityScore,
			overallScore,
		};
	}

	private calculateCyclomaticComplexity(code: string, language: string): number {
		let complexity = 1; // Base complexity

		// Count control flow statements
		const patterns = this.getComplexityPatterns(language);

		patterns.forEach((pattern) => {
			const matches = code.match(pattern);
			if (matches) {
				complexity += matches.length;
			}
		});

		// Count logical operators
		const logicalOps = (code.match(/\|\||&&/g) || []).length;
		complexity += logicalOps;

		return complexity;
	}

	private getComplexityPatterns(language: string): RegExp[] {
		const basePatterns = [
			/\bif\b/g,
			/\belse\b/g,
			/\bfor\b/g,
			/\bwhile\b/g,
			/\bdo\b/g,
			/\bswitch\b/g,
			/\bcase\b/g,
			/\bcatch\b/g,
			/\?\s*:/g, // ternary operator
		];

		switch (language) {
			case "javascript":
			case "typescript":
				return [...basePatterns, /\btry\b/g, /\bfinally\b/g];
			case "python":
				return [...basePatterns, /\bexcept\b/g, /\bfinally\b/g, /\bwith\b/g];
			case "rust":
				return [...basePatterns, /\bmatch\b/g, /\bif\s+let\b/g, /\bwhile\s+let\b/g];
			default:
				return basePatterns;
		}
	}

	private calculateMaintainabilityIndex(linesOfCode: number, complexity: number): number {
		// Simplified maintainability index calculation
		// MI = 171 - 5.2 * ln(Halstead Volume) - 0.23 * CC - 16.2 * ln(LOC)
		// Using a simplified version for demonstration

		const locFactor = Math.log(Math.max(linesOfCode, 1)) * 16.2;
		const complexityFactor = complexity * 0.23;

		let mi = 171 - complexityFactor - locFactor;

		// Adjust for other factors
		mi = Math.max(0, Math.min(171, mi));

		return mi;
	}

	private isCommentLine(line: string, language: string): boolean {
		const trimmed = line.trim();

		switch (language) {
			case "javascript":
			case "typescript":
				return (
					trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.includes("*/")
				);
			case "python":
				return trimmed.startsWith("#");
			case "rust":
				return trimmed.startsWith("//") || trimmed.startsWith("/*");
			default:
				return trimmed.startsWith("//") || trimmed.startsWith("#");
		}
	}

	private extractFunctions(
		code: string,
		language: string
	): Array<{ name: string; lines: string[] }> {
		const functions: Array<{ name: string; lines: string[] }> = [];

		switch (language) {
			case "javascript":
			case "typescript": {
				// Match function declarations and arrow functions
				const jsFunctions = code.match(/function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g) || [];
				jsFunctions.forEach((func) => {
					const lines = func.split("\n");
					const nameMatch = func.match(/function\s+(\w+)/);
					const name = nameMatch ? nameMatch[1] : "anonymous";
					functions.push({ name, lines });
				});
				break;
			}

			case "python": {
				// Match def statements
				const pyFunctions =
					code.match(/def\s+\w+\s*\([^)]*\):[\s\S]*?(?=\n\ndef|\nclass|\n@|\n\n|\n$)/g) ||
					[];
				pyFunctions.forEach((func) => {
					const lines = func.split("\n");
					const nameMatch = func.match(/def\s+(\w+)/);
					const name = nameMatch ? nameMatch[1] : "anonymous";
					functions.push({ name, lines });
				});
				break;
			}

			case "rust": {
				// Match fn statements
				const rustFunctions =
					code.match(/fn\s+\w+\s*\([^)]*\)\s*(->\s*\w+\s*)?\{[\s\S]*?\}/g) || [];
				rustFunctions.forEach((func) => {
					const lines = func.split("\n");
					const nameMatch = func.match(/fn\s+(\w+)/);
					const name = nameMatch ? nameMatch[1] : "anonymous";
					functions.push({ name, lines });
				});
				break;
			}
			default:
				break;
		}

		return functions;
	}

	private calculateDuplicateCodeRatio(lines: string[]): number {
		if (lines.length < 4) return 0;

		const duplicates = new Set<string>();
		const seen = new Set<string>();

		// Check for duplicate lines (simplified)
		lines.forEach((line) => {
			const trimmed = line.trim();
			if (trimmed.length > 10) {
				// Only check substantial lines
				if (seen.has(trimmed)) {
					duplicates.add(trimmed);
				} else {
					seen.add(trimmed);
				}
			}
		});

		return lines.length > 0 ? duplicates.size / lines.length : 0;
	}

	private calculateNamingConventionScore(code: string, language: string): number {
		let score = 100;

		switch (language) {
			case "javascript":
			case "typescript": {
				// Check for camelCase variables and functions
				const identifiers = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
				const badNames = identifiers.filter((id) => {
					// Check for snake_case in JS/TS (should be camelCase)
					return id.includes("_") && !id.startsWith("_");
				});
				score -= badNames.length * 5;
				break;
			}

			case "python": {
				// Check for snake_case
				const pyIdentifiers = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
				const badPyNames = pyIdentifiers.filter((id) => {
					// Check for camelCase in Python (should be snake_case)
					return /[a-z][A-Z]/.test(id);
				});
				score -= badPyNames.length * 5;
				break;
			}

			case "rust": {
				// Check for snake_case
				const rustIdentifiers = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
				const badRustNames = rustIdentifiers.filter((id) => {
					// Check for camelCase in Rust functions (should be snake_case)
					return /[a-z][A-Z]/.test(id) && !id.startsWith("A-Z");
				});
				score -= badRustNames.length * 5;
				break;
			}

			default:
				break;
		}

		return Math.max(0, score);
	}

	private calculateErrorHandlingScore(code: string, language: string): number {
		let score = 0;

		switch (language) {
			case "javascript":
			case "typescript":
				if (code.includes("try") && code.includes("catch")) score += 50;
				if (code.includes("throw")) score += 25;
				if (code.includes("finally")) score += 25;
				break;

			case "python":
				if (code.includes("try:") && code.includes("except")) score += 50;
				if (code.includes("raise")) score += 25;
				if (code.includes("finally:")) score += 25;
				break;

			case "rust":
				if (code.includes("Result<") || code.includes("Option<")) score += 50;
				if (code.includes("match") && (code.includes("Ok(") || code.includes("Err(")))
					score += 25;
				if (code.includes("unwrap_or") || code.includes("expect(")) score += 25;
				break;

			default:
				break;
		}

		return Math.min(100, score);
	}

	private calculateTestabilityScore(code: string, _language: string): number {
		let score = 50; // Base score

		// Check for pure functions (no side effects)
		const hasConsole = code.includes("console.");
		const hasGlobalVars = /\bvar\s+\w+/.test(code) || /\blet\s+\w+\s*=/.test(code);

		if (!hasConsole) score += 20;
		if (!hasGlobalVars) score += 30;

		// Check for dependency injection
		if (code.includes("function") && /\([^)]*\w+\s*\)/.test(code)) {
			score += 20;
		}

		return Math.min(100, score);
	}

	private calculateOverallScore(metrics: Partial<CodeQualityMetrics>): number {
		const weights = {
			maintainabilityIndex: 0.25,
			cyclomaticComplexity: 0.2,
			commentRatio: 0.1,
			averageFunctionLength: 0.1,
			duplicateCodeRatio: 0.1,
			namingConventionScore: 0.1,
			errorHandlingScore: 0.05,
			testabilityScore: 0.1,
		};

		let score = 0;

		// Maintainability index (higher is better)
		score += (metrics.maintainabilityIndex! / 100) * weights.maintainabilityIndex;

		// Cyclomatic complexity (lower is better)
		const complexityScore = Math.max(0, 1 - metrics.cyclomaticComplexity! / 50);
		score += complexityScore * weights.cyclomaticComplexity;

		// Comment ratio (higher is better)
		score += Math.min(metrics.commentRatio! * 2, 1) * weights.commentRatio;

		// Function length (lower is better)
		const lengthScore = Math.max(0, 1 - metrics.averageFunctionLength! / 100);
		score += lengthScore * weights.averageFunctionLength;

		// Duplicate code (lower is better)
		score += (1 - metrics.duplicateCodeRatio!) * weights.duplicateCodeRatio;

		// Naming conventions (higher is better)
		score += (metrics.namingConventionScore! / 100) * weights.namingConventionScore;

		// Error handling (higher is better)
		score += (metrics.errorHandlingScore! / 100) * weights.errorHandlingScore;

		// Testability (higher is better)
		score += (metrics.testabilityScore! / 100) * weights.testabilityScore;

		return Math.round(score * 100);
	}

	private identifyIssues(
		code: string,
		language: string,
		metrics: CodeQualityMetrics
	): CodeQualityIssue[] {
		const issues: CodeQualityIssue[] = [];

		// Complexity issues
		if (metrics.cyclomaticComplexity > CodeQualityAnalyzer.COMPLEXITY_THRESHOLDS.poor) {
			issues.push({
				type: "complexity",
				severity: "high",
				message: `Cyclomatic complexity is very high (${metrics.cyclomaticComplexity})`,
				suggestion: "Break down the function into smaller, more focused functions",
			});
		} else if (metrics.cyclomaticComplexity > CodeQualityAnalyzer.COMPLEXITY_THRESHOLDS.fair) {
			issues.push({
				type: "complexity",
				severity: "medium",
				message: `Cyclomatic complexity is high (${metrics.cyclomaticComplexity})`,
				suggestion: "Consider simplifying conditional logic",
			});
		}

		// Maintainability issues
		if (metrics.maintainabilityIndex < CodeQualityAnalyzer.MAINTAINABILITY_THRESHOLDS.poor) {
			issues.push({
				type: "maintainability",
				severity: "high",
				message: `Code maintainability is very low (${metrics.maintainabilityIndex.toFixed(1)})`,
				suggestion: "Refactor to reduce complexity and improve structure",
			});
		}

		// Function length issues
		if (metrics.maxFunctionLength > CodeQualityAnalyzer.FUNCTION_LENGTH_THRESHOLDS.poor) {
			issues.push({
				type: "readability",
				severity: "high",
				message: `Some functions are very long (${metrics.maxFunctionLength} lines)`,
				suggestion: "Break long functions into smaller, focused functions",
			});
		}

		// Comment issues
		if (metrics.commentRatio < 0.05) {
			issues.push({
				type: "readability",
				severity: "medium",
				message: "Code has very few comments",
				suggestion: "Add comments to explain complex logic and function purposes",
			});
		}

		// Duplicate code issues
		if (metrics.duplicateCodeRatio > 0.1) {
			issues.push({
				type: "maintainability",
				severity: "medium",
				message: `Significant code duplication detected (${(metrics.duplicateCodeRatio * 100).toFixed(1)}%)`,
				suggestion: "Extract common code into reusable functions",
			});
		}

		// Naming convention issues
		if (metrics.namingConventionScore < 70) {
			issues.push({
				type: "convention",
				severity: "medium",
				message: "Naming conventions are not followed consistently",
				suggestion: `Use ${language === "python" ? "snake_case" : "camelCase"} for ${language} code`,
			});
		}

		// Error handling issues
		if (metrics.errorHandlingScore < 30) {
			issues.push({
				type: "maintainability",
				severity: "medium",
				message: "Limited error handling detected",
				suggestion: "Add proper error handling and validation",
			});
		}

		// Security issues (basic check)
		if (code.includes("eval(") || code.includes("Function(")) {
			issues.push({
				type: "security",
				severity: "critical",
				message: "Potentially unsafe code execution detected",
				suggestion: "Avoid using eval() or Function() constructors",
			});
		}

		return issues;
	}

	private generateSuggestions(issues: CodeQualityIssue[], metrics: CodeQualityMetrics): string[] {
		const suggestions: string[] = [];

		// General suggestions based on metrics
		if (metrics.overallScore < 50) {
			suggestions.push("Consider a complete refactor to improve code quality");
		} else if (metrics.overallScore < 70) {
			suggestions.push("Focus on reducing complexity and improving structure");
		}

		// Specific suggestions based on issues
		const hasComplexityIssues = issues.some((i) => i.type === "complexity");
		const hasReadabilityIssues = issues.some((i) => i.type === "readability");

		if (hasComplexityIssues) {
			suggestions.push(
				"Apply the Single Responsibility Principle to reduce function complexity"
			);
		}

		if (hasReadabilityIssues) {
			suggestions.push(
				"Improve code readability by using descriptive variable names and adding comments"
			);
		}

		// Language-specific suggestions
		if (metrics.errorHandlingScore < 50) {
			suggestions.push("Implement comprehensive error handling with try-catch blocks");
		}

		if (metrics.testabilityScore < 50) {
			suggestions.push(
				"Improve testability by reducing side effects and using dependency injection"
			);
		}

		return suggestions;
	}

	private calculateGrade(metrics: CodeQualityMetrics): "A" | "B" | "C" | "D" | "F" {
		const score = metrics.overallScore;

		if (score >= 90) return "A";
		if (score >= 80) return "B";
		if (score >= 70) return "C";
		if (score >= 60) return "D";
		return "F";
	}
}
