import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

type TranslationTree = Record<string, unknown>;

function listMissingKeys(base: TranslationTree, target: TranslationTree, prefix = ""): string[] {
	const missing: string[] = [];

	for (const key of Object.keys(base)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		if (!(key in target)) {
			missing.push(fullKey);
			continue;
		}

		const baseValue = base[key];
		const targetValue = target[key];
		const baseIsObject = typeof baseValue === "object" && baseValue !== null;
		const targetIsObject = typeof targetValue === "object" && targetValue !== null;

		if (baseIsObject) {
			if (!targetIsObject) {
				missing.push(fullKey);
				continue;
			}
			missing.push(...listMissingKeys(baseValue as TranslationTree, targetValue as TranslationTree, fullKey));
		}
	}

	return missing;
}

describe("i18n translation coverage", () => {
	it("keeps pt-BR and es key-complete with en", () => {
		const localesDir = path.resolve(process.cwd(), "../packages/i18n/locales");
		const english = JSON.parse(
			fs.readFileSync(path.join(localesDir, "en.json"), "utf-8")
		) as TranslationTree;

		for (const locale of ["pt-BR", "es"]) {
			const candidate = JSON.parse(
				fs.readFileSync(path.join(localesDir, `${locale}.json`), "utf-8")
			) as TranslationTree;
			const missing = listMissingKeys(english, candidate);

			expect(
				missing,
				`${locale} is missing ${missing.length} translation keys compared to en`
			).toEqual([]);
		}
	});
});
