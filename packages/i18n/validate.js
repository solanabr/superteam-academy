const fs = require("node:fs");
const path = require("node:path");

const locales = ["en", "pt-BR", "es"];
const results = {};

for (const locale of locales) {
	try {
		const content = fs.readFileSync(path.join("messages", `${locale}.json`), "utf-8");
		const translations = JSON.parse(content);

		// Basic structure check
		const requiredSections = [
			"common",
			"navigation",
			"auth",
			"courses",
			"learning",
			"profile",
			"settings",
			"errors",
			"validation",
			"accessibility",
		];
		const missingSections = requiredSections.filter((section) => !translations[section]);

		results[locale] = {
			valid: missingSections.length === 0,
			missingSections,
			error: null,
		};

		if (missingSections.length > 0) {
			// ignored
		} else {
			// ignored
		}
	} catch (error) {
		results[locale] = {
			valid: false,
			missingSections: [],
			error: error.message,
		};
	}
}

const _allValid = Object.values(results).every((r) => r.valid);
