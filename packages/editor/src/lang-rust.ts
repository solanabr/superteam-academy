// Rust language support for CodeMirror 6
// This is a simplified implementation - in production you'd use @codemirror/lang-rust

import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { parser } from "./rust-parser"; // You'd need to implement or import a proper parser

export function rust(): LanguageSupport {
	// This is a placeholder - in a real implementation you'd use:
	// import { rustLanguage } from '@codemirror/lang-rust';
	// return new LanguageSupport(rustLanguage);

	return new LanguageSupport(
		LRLanguage.define({
			name: "rust",
			parser: parser, // You'd need to implement this
			languageData: {
				commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
				indentOnInput: /^\s*(?:\{|\}|case |default:)$/,
			},
		})
	);
}
