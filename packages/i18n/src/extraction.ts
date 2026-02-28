import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

export interface ExtractedKey {
	key: string;
	file: string;
	line: number;
	context: string;
}

export interface ExtractionResult {
	keys: ExtractedKey[];
	files: string[];
	totalFiles: number;
}

export class TranslationExtractor {
	private sourceDir: string;

	constructor(
		sourceDir: string = path.join(__dirname, "../../../app/src"),
		_excludePatterns: string[] = ["node_modules", ".next", "dist", "build"]
	) {
		this.sourceDir = sourceDir;
	}

	async extractKeys(): Promise<ExtractionResult> {
		const files = await this.findSourceFiles();
		const keys: ExtractedKey[] = [];

		for (const file of files) {
			const fileKeys = await this.extractFromFile(file);
			keys.push(...fileKeys);
		}

		return {
			keys,
			files,
			totalFiles: files.length,
		};
	}

	private async findSourceFiles(): Promise<string[]> {
		const patterns = [
			"**/*.{ts,tsx,js,jsx}",
			"!**/node_modules/**",
			"!**/.next/**",
			"!**/dist/**",
			"!**/build/**",
			"!**/*.test.{ts,tsx,js,jsx}",
			"!**/*.spec.{ts,tsx,js,jsx}",
			"!**/*.d.ts",
		];

		const files = await glob(patterns, {
			cwd: this.sourceDir,
			absolute: true,
		});

		return files;
	}

	private async extractFromFile(filePath: string): Promise<ExtractedKey[]> {
		const content = fs.readFileSync(filePath, "utf-8");
		const lines = content.split("\n");
		const keys: ExtractedKey[] = [];

		const patterns = [
			/t\(['"]([^'"]+)['"]/g,
			/t\.rich\(['"]([^'"]+)['"]/g,
			/useTranslations\(\)\(['"]([^'"]+)['"]/g,
			/getTranslations\(\)\(['"]([^'"]+)['"]/g,
			/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g,
		];

		lines.forEach((line, index) => {
			patterns.forEach((pattern) => {
				let match: RegExpExecArray | null = pattern.exec(line);
				while (match !== null) {
					const key = match[1];
					if (this.isValidTranslationKey(key)) {
						keys.push({
							key,
							file: path.relative(this.sourceDir, filePath),
							line: index + 1,
							context: line.trim(),
						});
					}
					match = pattern.exec(line);
				}
			});
		});

		return keys;
	}

	private isValidTranslationKey(key: string): boolean {
		return (
			key.length > 0 && key.length < 100 && /^[a-zA-Z0-9_.]+$/.test(key) && key.includes(".")
		);
	}

	async generateMissingKeysReport(
		existingTranslations: Record<string, unknown>
	): Promise<string> {
		const extraction = await this.extractKeys();
		const existingKeys = this.flattenKeys(existingTranslations);
		const foundKeys = new Set(extraction.keys.map((k) => k.key));

		const missingKeys = Array.from(foundKeys).filter((key) => !existingKeys.has(key));

		let report = "# Missing Translation Keys Report\n\n";
		report += `Found ${extraction.keys.length} translation keys in ${extraction.totalFiles} files.\n\n`;

		if (missingKeys.length === 0) {
			report += "✅ All translation keys are present!\n";
		} else {
			report += `❌ Found ${missingKeys.length} missing translation keys:\n\n`;

			const keysByFile: Record<string, string[]> = {};
			extraction.keys.forEach((extracted) => {
				if (missingKeys.includes(extracted.key)) {
					if (!keysByFile[extracted.file]) {
						keysByFile[extracted.file] = [];
					}
					keysByFile[extracted.file].push(extracted.key);
				}
			});

			for (const [file, keys] of Object.entries(keysByFile)) {
				report += `## ${file}\n`;
				keys.forEach((key) => {
					report += `- \`${key}\`\n`;
				});
				report += "\n";
			}
		}

		return report;
	}

	private flattenKeys(obj: Record<string, unknown>, prefix = ""): Set<string> {
		const keys = new Set<string>();

		for (const key in obj) {
			const fullKey = prefix ? `${prefix}.${key}` : key;
			const val = obj[key];

			if (typeof val === "object" && val !== null) {
				const nestedKeys = this.flattenKeys(val as Record<string, unknown>, fullKey);
				for (const k of nestedKeys) {
					keys.add(k);
				}
			} else {
				keys.add(fullKey);
			}
		}

		return keys;
	}

	async updateTranslationFiles(
		missingKeys: string[],
		locales: string[] = ["en", "pt-BR", "es"]
	): Promise<void> {
		const messagesDir = path.join(__dirname, "../locales");

		for (const locale of locales) {
			const filePath = path.join(messagesDir, `${locale}.json`);

			try {
				const content = fs.readFileSync(filePath, "utf-8");
				const translations = JSON.parse(content);

				for (const key of missingKeys) {
					this.setNestedValue(translations, key, `[${locale.toUpperCase()}] ${key}`);
				}

				fs.writeFileSync(filePath, `${JSON.stringify(translations, null, 2)}\n`);
			} catch (error) {
				console.error(`❌ Failed to update ${locale}.json:`, error);
			}
		}
	}

	private setNestedValue(obj: Record<string, unknown>, key: string, value: unknown): void {
		const parts = key.split(".");
		let current: Record<string, unknown> = obj;

		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (part === undefined) continue;
			if (!current[part]) {
				current[part] = {};
			}
			current = current[part] as Record<string, unknown>;
		}

		const lastPart = parts[parts.length - 1];
		if (lastPart !== undefined) {
			current[lastPart] = value;
		}
	}

	async generateTemplate(baseLocale = "es"): Promise<Record<string, unknown>> {
		const baseFile = path.join(__dirname, "../locales", `${baseLocale}.json`);
		const content = fs.readFileSync(baseFile, "utf-8");
		const baseTranslations = JSON.parse(content);

		const template = this.createTemplate(baseTranslations, baseLocale);

		return template as Record<string, unknown>;
	}

	private createTemplate(
		obj: Record<string, unknown>,
		locale: string,
		prefix = ""
	): Record<string, unknown> {
		const template: Record<string, unknown> = {};

		for (const key in obj) {
			const fullKey = prefix ? `${prefix}.${key}` : key;
			const val = obj[key];

			if (typeof val === "object" && val !== null) {
				template[key] = this.createTemplate(
					val as Record<string, unknown>,
					locale,
					fullKey
				);
			} else {
				template[key] = `[${locale.toUpperCase()}] ${fullKey}`;
			}
		}

		return template;
	}
}

export async function extractTranslations(): Promise<void> {
	const extractor = new TranslationExtractor();

	try {
		const result = await extractor.extractKeys();

		const keysByFile: Record<string, ExtractedKey[]> = {};
		result.keys.forEach((key) => {
			if (!keysByFile[key.file]) {
				keysByFile[key.file] = [];
			}
			keysByFile[key.file].push(key);
		});
		for (const [_file, keys] of Object.entries(keysByFile)) {
			keys.forEach((_key) => {
				/* ignored */
			});
		}
	} catch (error) {
		console.error("❌ Extraction failed:", error);
		process.exit(1);
	}
}

export async function checkMissingTranslations(): Promise<void> {
	const extractor = new TranslationExtractor();
	const messagesDir = path.join(__dirname, "../locales");

	try {
		const baseContent = fs.readFileSync(path.join(messagesDir, "en.json"), "utf-8");
		const baseTranslations = JSON.parse(baseContent);

		await extractor.generateMissingKeysReport(baseTranslations);
	} catch (error) {
		console.error("❌ Check failed:", error);
		process.exit(1);
	}
}

if (require.main === module) {
	const command = process.argv[2];

	if (command === "check") {
		checkMissingTranslations();
	} else {
		extractTranslations();
	}
}
