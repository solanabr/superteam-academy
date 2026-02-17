import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

/**
 * Translation validation utilities
 * Ensures translation files are complete and consistent
 */

// Translation file schema for validation
const TranslationSchema = z.object({
	common: z.object({
		loading: z.string(),
		error: z.string(),
		success: z.string(),
		cancel: z.string(),
		save: z.string(),
		delete: z.string(),
		edit: z.string(),
		create: z.string(),
		search: z.string(),
		filter: z.string(),
		sort: z.string(),
		next: z.string(),
		previous: z.string(),
		close: z.string(),
		open: z.string(),
		back: z.string(),
		continue: z.string(),
		submit: z.string(),
		reset: z.string(),
		clear: z.string(),
		select: z.string(),
		selected: z.string(),
		all: z.string(),
		none: z.string(),
		yes: z.string(),
		no: z.string(),
		ok: z.string(),
		retry: z.string(),
		refresh: z.string(),
	}),
	navigation: z.object({
		home: z.string(),
		courses: z.string(),
		learn: z.string(),
		leaderboard: z.string(),
		profile: z.string(),
		settings: z.string(),
		help: z.string(),
		logout: z.string(),
		login: z.string(),
		signup: z.string(),
	}),
	auth: z.object({
		connectWallet: z.string(),
		disconnectWallet: z.string(),
		walletConnected: z.string(),
		walletDisconnected: z.string(),
		linkGoogle: z.string(),
		linkGithub: z.string(),
		unlinkAccount: z.string(),
		accountLinked: z.string(),
		accountUnlinked: z.string(),
		signInWith: z.string(),
		signUpWith: z.string(),
		email: z.string(),
		password: z.string(),
		confirmPassword: z.string(),
		forgotPassword: z.string(),
		resetPassword: z.string(),
		createAccount: z.string(),
		alreadyHaveAccount: z.string(),
		dontHaveAccount: z.string(),
		invalidCredentials: z.string(),
		accountCreated: z.string(),
		passwordResetSent: z.string(),
		passwordReset: z.string(),
	}),
	courses: z.object({
		title: z.string(),
		enrolled: z.string(),
		completed: z.string(),
		inProgress: z.string(),
		notStarted: z.string(),
		difficulty: z.object({
			beginner: z.string(),
			intermediate: z.string(),
			advanced: z.string(),
		}),
		duration: z.string(),
		xpReward: z.string(),
		enroll: z.string(),
		unenroll: z.string(),
		startCourse: z.string(),
		continueCourse: z.string(),
		courseCompleted: z.string(),
		prerequisites: z.string(),
		modules: z.string(),
		lessons: z.string(),
		challenges: z.string(),
		certificate: z.string(),
		progress: z.string(),
		timeRemaining: z.string(),
		estimatedTime: z.string(),
		lastAccessed: z.string(),
		instructor: z.string(),
		rating: z.string(),
		reviews: z.string(),
		share: z.string(),
		bookmark: z.string(),
		bookmarked: z.string(),
		unbookmark: z.string(),
	}),
	learning: z.object({
		startLesson: z.string(),
		completeLesson: z.string(),
		nextLesson: z.string(),
		previousLesson: z.string(),
		lessonCompleted: z.string(),
		challengeCompleted: z.string(),
		xpEarned: z.string(),
		streak: z.string(),
		achievements: z.string(),
		leaderboard: z.string(),
		rank: z.string(),
		points: z.string(),
		level: z.string(),
		progress: z.string(),
		completion: z.string(),
		accuracy: z.string(),
		speed: z.string(),
		hints: z.string(),
		attempts: z.string(),
		bestTime: z.string(),
		averageTime: z.string(),
		codeEditor: z.string(),
		runCode: z.string(),
		submitSolution: z.string(),
		testResults: z.string(),
		console: z.string(),
		output: z.string(),
		error: z.string(),
		success: z.string(),
		failed: z.string(),
		timeout: z.string(),
		memoryLimit: z.string(),
		compilationError: z.string(),
		runtimeError: z.string(),
		testPassed: z.string(),
		testFailed: z.string(),
	}),
	profile: z.object({
		title: z.string(),
		personalInfo: z.string(),
		accountSettings: z.string(),
		learningStats: z.string(),
		achievements: z.string(),
		certificates: z.string(),
		preferences: z.string(),
		notifications: z.string(),
		privacy: z.string(),
		security: z.string(),
		name: z.string(),
		bio: z.string(),
		location: z.string(),
		website: z.string(),
		socialLinks: z.string(),
		totalXp: z.string(),
		coursesCompleted: z.string(),
		lessonsCompleted: z.string(),
		challengesCompleted: z.string(),
		currentStreak: z.string(),
		longestStreak: z.string(),
		learningTime: z.string(),
		averageScore: z.string(),
		rank: z.string(),
		badges: z.string(),
		level: z.string(),
		progress: z.string(),
	}),
	settings: z.object({
		title: z.string(),
		language: z.string(),
		theme: z.string(),
		notifications: z.string(),
		privacy: z.string(),
		account: z.string(),
		appearance: z.string(),
		accessibility: z.string(),
		light: z.string(),
		dark: z.string(),
		system: z.string(),
		emailNotifications: z.string(),
		pushNotifications: z.string(),
		marketingEmails: z.string(),
		courseUpdates: z.string(),
		achievementNotifications: z.string(),
		weeklyDigest: z.string(),
		publicProfile: z.string(),
		showProgress: z.string(),
		showAchievements: z.string(),
		dataExport: z.string(),
		deleteAccount: z.string(),
		changePassword: z.string(),
		twoFactorAuth: z.string(),
		backupCodes: z.string(),
		sessions: z.string(),
		connectedAccounts: z.string(),
	}),
	errors: z.object({
		generic: z.string(),
		network: z.string(),
		unauthorized: z.string(),
		forbidden: z.string(),
		notFound: z.string(),
		validation: z.string(),
		server: z.string(),
		timeout: z.string(),
		rateLimit: z.string(),
		wallet: z.object({
			notConnected: z.string(),
			wrongNetwork: z.string(),
			transactionFailed: z.string(),
			insufficientFunds: z.string(),
			userRejected: z.string(),
		}),
		auth: z.object({
			invalidCredentials: z.string(),
			accountDisabled: z.string(),
			emailNotVerified: z.string(),
			weakPassword: z.string(),
			passwordMismatch: z.string(),
			accountExists: z.string(),
			invalidToken: z.string(),
			sessionExpired: z.string(),
		}),
		learning: z.object({
			lessonNotFound: z.string(),
			courseNotFound: z.string(),
			challengeNotFound: z.string(),
			alreadyCompleted: z.string(),
			prerequisitesNotMet: z.string(),
			timeLimitExceeded: z.string(),
			attemptsExceeded: z.string(),
			invalidSolution: z.string(),
		}),
	}),
	validation: z.object({
		required: z.string(),
		email: z.string(),
		minLength: z.string(),
		maxLength: z.string(),
		password: z.string(),
		url: z.string(),
		number: z.string(),
		positive: z.string(),
		date: z.string(),
		future: z.string(),
		past: z.string(),
	}),
	accessibility: z.object({
		skipToContent: z.string(),
		skipToNavigation: z.string(),
		openMenu: z.string(),
		closeMenu: z.string(),
		expand: z.string(),
		collapse: z.string(),
		loading: z.string(),
		error: z.string(),
		success: z.string(),
		info: z.string(),
		warning: z.string(),
		screenReader: z.string(),
	}),
});

/**
 * Translation validation result
 */
export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	missingKeys: string[];
	extraKeys: string[];
}

/**
 * Translation validator class
 */
export class TranslationValidator {
	private messagesDir: string;

	constructor(messagesDir: string = path.join(__dirname, "../messages")) {
		this.messagesDir = messagesDir;
	}

	/**
	 * Validate a single translation file
	 */
	async validateFile(locale: string): Promise<ValidationResult> {
		const filePath = path.join(this.messagesDir, `${locale}.json`);

		try {
			const content = fs.readFileSync(filePath, "utf-8");
			const translations = JSON.parse(content);

			const result = TranslationSchema.safeParse(translations);

			if (!result.success) {
				return {
					isValid: false,
					errors: result.error.issues.map(
						(err) => `${err.path.map(String).join(".")}: ${err.message}`
					),
					warnings: [],
					missingKeys: [],
					extraKeys: [],
				};
			}

			return {
				isValid: true,
				errors: [],
				warnings: [],
				missingKeys: [],
				extraKeys: [],
			};
		} catch (error) {
			return {
				isValid: false,
				errors: [
					`Failed to read or parse ${locale}.json: ${error instanceof Error ? error.message : String(error)}`,
				],
				warnings: [],
				missingKeys: [],
				extraKeys: [],
			};
		}
	}

	/**
	 * Validate all translation files
	 */
	async validateAll(): Promise<Record<string, ValidationResult>> {
		const results: Record<string, ValidationResult> = {};
		const locales = ["en", "pt-BR", "es"];

		for (const locale of locales) {
			results[locale] = await this.validateFile(locale);
		}

		return results;
	}

	/**
	 * Compare translations between locales to find missing keys
	 */
	async compareTranslations(baseLocale = "en"): Promise<Record<string, ValidationResult>> {
		const results: Record<string, ValidationResult> = {};
		const baseFile = path.join(this.messagesDir, `${baseLocale}.json`);

		try {
			const baseContent = fs.readFileSync(baseFile, "utf-8");
			const baseTranslations = JSON.parse(baseContent);

			const locales = ["pt-BR", "es"];

			for (const locale of locales) {
				const filePath = path.join(this.messagesDir, `${locale}.json`);
				const result: ValidationResult = {
					isValid: true,
					errors: [],
					warnings: [],
					missingKeys: [],
					extraKeys: [],
				};

				try {
					const content = fs.readFileSync(filePath, "utf-8");
					const translations = JSON.parse(content);

					// Find missing keys
					const missingKeys = this.findMissingKeys(baseTranslations, translations);
					result.missingKeys = missingKeys;

					// Find extra keys
					const extraKeys = this.findExtraKeys(baseTranslations, translations);
					result.extraKeys = extraKeys;

					if (missingKeys.length > 0) {
						result.warnings.push(
							`Missing ${missingKeys.length} keys compared to ${baseLocale}`
						);
						result.isValid = false;
					}

					if (extraKeys.length > 0) {
						result.warnings.push(
							`Extra ${extraKeys.length} keys compared to ${baseLocale}`
						);
					}
				} catch (error) {
					result.isValid = false;
					result.errors.push(
						`Failed to read or parse ${locale}.json: ${error instanceof Error ? error.message : String(error)}`
					);
				}

				results[locale] = result;
			}
		} catch (error) {
			results[baseLocale] = {
				isValid: false,
				errors: [
					`Failed to read base locale ${baseLocale}.json: ${error instanceof Error ? error.message : String(error)}`,
				],
				warnings: [],
				missingKeys: [],
				extraKeys: [],
			};
		}

		return results;
	}

	/**
	 * Find missing keys in target compared to base
	 */
	private findMissingKeys(
		base: Record<string, unknown>,
		target: Record<string, unknown>,
		prefix = ""
	): string[] {
		const missing: string[] = [];

		for (const key in base) {
			const fullKey = prefix ? `${prefix}.${key}` : key;

			if (!(key in target)) {
				missing.push(fullKey);
			} else if (typeof base[key] === "object" && base[key] !== null) {
				const baseVal = base[key] as Record<string, unknown>;
				const targetVal = target[key];
				if (typeof targetVal === "object" && targetVal !== null) {
					missing.push(
						...this.findMissingKeys(baseVal, targetVal as Record<string, unknown>, fullKey)
					);
				} else {
					missing.push(fullKey);
				}
			}
		}

		return missing;
	}

	/**
	 * Find extra keys in target compared to base
	 */
	private findExtraKeys(
		base: Record<string, unknown>,
		target: Record<string, unknown>,
		prefix = ""
	): string[] {
		const extra: string[] = [];

		for (const key in target) {
			const fullKey = prefix ? `${prefix}.${key}` : key;

			if (!(key in base)) {
				extra.push(fullKey);
			} else if (typeof target[key] === "object" && target[key] !== null) {
				const targetVal = target[key] as Record<string, unknown>;
				const baseVal = base[key];
				if (typeof baseVal === "object" && baseVal !== null) {
					extra.push(
						...this.findExtraKeys(baseVal as Record<string, unknown>, targetVal, fullKey)
					);
				} else {
					extra.push(fullKey);
				}
			}
		}

		return extra;
	}

	/**
	 * Generate a report of validation results
	 */
	generateReport(results: Record<string, ValidationResult>): string {
		let report = "# Translation Validation Report\n\n";

		for (const [locale, result] of Object.entries(results)) {
			report += `## ${locale}\n\n`;
			report += `Status: ${result.isValid ? "✅ Valid" : "❌ Invalid"}\n\n`;

			if (result.errors.length > 0) {
				report += "### Errors:\n";
				result.errors.forEach((error) => {
					report += `- ${error}\n`;
				});
				report += "\n";
			}

			if (result.warnings.length > 0) {
				report += "### Warnings:\n";
				result.warnings.forEach((warning) => {
					report += `- ${warning}\n`;
				});
				report += "\n";
			}

			if (result.missingKeys.length > 0) {
				report += "### Missing Keys:\n";
				result.missingKeys.forEach((key) => {
					report += `- ${key}\n`;
				});
				report += "\n";
			}

			if (result.extraKeys.length > 0) {
				report += "### Extra Keys:\n";
				result.extraKeys.forEach((key) => {
					report += `- ${key}\n`;
				});
				report += "\n";
			}
		}

		return report;
	}
}

/**
 * CLI utility for validation
 */
export async function validateTranslations(): Promise<void> {
	const validator = new TranslationValidator();

	const results = await validator.validateAll();
	const comparisonResults = await validator.compareTranslations();

	// Merge results
	const allResults = { ...results, ...comparisonResults };

	validator.generateReport(allResults);

	const hasErrors = Object.values(allResults).some((result) => !result.isValid);
	if (hasErrors) {
		process.exit(1);
	}
}

// Run validation if called directly
if (require.main === module) {
	validateTranslations().catch(console.error);
}
