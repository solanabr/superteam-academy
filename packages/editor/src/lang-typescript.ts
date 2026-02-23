import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { parser } from "./typescript-parser";

export function typescript(): LanguageSupport {
	return new LanguageSupport(
		LRLanguage.define({
			name: "typescript",
			parser: parser,
			languageData: {
				commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
				indentOnInput: /^\s*(?:case |default:|\{|\}|<\/)$/,
			},
		})
	);
}
