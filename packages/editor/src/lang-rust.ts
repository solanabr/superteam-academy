import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { parser } from "./rust-parser";

export function rust(): LanguageSupport {
	return new LanguageSupport(
		LRLanguage.define({
			name: "rust",
			parser: parser,
			languageData: {
				commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
				indentOnInput: /^\s*(?:\{|\}|case |default:)$/,
			},
		})
	);
}
