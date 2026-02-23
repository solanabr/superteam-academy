import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { parser } from "./python-parser";

export function python(): LanguageSupport {
	return new LanguageSupport(
		LRLanguage.define({
			name: "python",
			parser: parser,
			languageData: {
				commentTokens: { line: "#" },
				indentOnInput:
					/^\s*(?:def |class |if |elif |else:|for |while |try:|except |finally:|with )/,
			},
		})
	);
}
