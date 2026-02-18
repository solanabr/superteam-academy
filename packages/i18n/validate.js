const fs = require("node:fs");
const path = require("node:path");

const localesDir = path.join(__dirname, "locales");
const locales = fs
	.readdirSync(localesDir)
	.filter((file) => file.endsWith(".json"))
	.map((file) => file.replace(/\.json$/, ""));
const results = {};

const baseLocale = "en";
const baseTranslations = JSON.parse(
	fs.readFileSync(path.join(localesDir, `${baseLocale}.json`), "utf-8")
);
const requiredSections = Object.keys(baseTranslations);

for (const locale of locales) {
	try {
		const content = fs.readFileSync(path.join(localesDir, `${locale}.json`), "utf-8");
		const translations = JSON.parse(content);

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
