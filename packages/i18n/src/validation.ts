import fs from "node:fs";
import path from "node:path";

/**
 * Translation validation utilities
 * Ensures translation files are complete and consistent
 */

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	missingKeys: string[];
	extraKeys: string[];
}

export class TranslationValidator {
	private localesDir: string;

	constructor(localesDir: string = path.join(__dirname, "../locales")) {
		this.localesDir = localesDir;
	}

	private getAvailableLocales(): string[] {
		try {
			return fs
				.readdirSync(this.localesDir)
				.filter((file) => file.endsWith(".json"))
				.map((file) => file.replace(/\.json$/, ""));
		} catch {
			return ["en", "pt-BR", "es"];
		}
	}

	async validateFile(locale: string): Promise<ValidationResult> {
		const filePath = path.join(this.localesDir, `${locale}.json`);

		try {
			const content = fs.readFileSync(filePath, "utf-8");
			const translations = JSON.parse(content);

			if (!translations || typeof translations !== "object" || Array.isArray(translations)) {
				return {
					isValid: false,
					errors: ["Root translation object must be a JSON object"],
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

	async validateAll(): Promise<Record<string, ValidationResult>> {
		const results: Record<string, ValidationResult> = {};
		const locales = this.getAvailableLocales();

		for (const locale of locales) {
			results[locale] = await this.validateFile(locale);
		}

		return results;
	}

	async compareTranslations(baseLocale = "en"): Promise<Record<string, ValidationResult>> {
		const results: Record<string, ValidationResult> = {};
		const baseFile = path.join(this.localesDir, `${baseLocale}.json`);

		try {
			const baseContent = fs.readFileSync(baseFile, "utf-8");
			const baseTranslations = JSON.parse(baseContent) as Record<string, unknown>;

			const locales = this.getAvailableLocales().filter((locale) => locale !== baseLocale);

			for (const locale of locales) {
				const filePath = path.join(this.localesDir, `${locale}.json`);
				const result: ValidationResult = {
					isValid: true,
					errors: [],
					warnings: [],
					missingKeys: [],
					extraKeys: [],
				};

				try {
					const content = fs.readFileSync(filePath, "utf-8");
					const translations = JSON.parse(content) as Record<string, unknown>;

					const missingKeys = this.findMissingKeys(baseTranslations, translations);
					result.missingKeys = missingKeys;

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
						...this.findMissingKeys(
							baseVal,
							targetVal as Record<string, unknown>,
							fullKey
						)
					);
				} else {
					missing.push(fullKey);
				}
			}
		}

		return missing;
	}

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
						...this.findExtraKeys(
							baseVal as Record<string, unknown>,
							targetVal,
							fullKey
						)
					);
				} else {
					extra.push(fullKey);
				}
			}
		}

		return extra;
	}

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

export async function validateTranslations(): Promise<void> {
	const validator = new TranslationValidator();

	const results = await validator.validateAll();
	const comparisonResults = await validator.compareTranslations("en");
	const allResults = { ...results, ...comparisonResults };

	const hasErrors = Object.values(allResults).some((result) => !result.isValid);
	if (hasErrors) {
		process.exit(1);
	}
}

if (require.main === module) {
	validateTranslations().catch(console.error);
}
