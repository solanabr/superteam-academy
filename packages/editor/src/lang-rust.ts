import { rust as officialRust } from "@codemirror/lang-rust";
import type { LanguageSupport } from "@codemirror/language";

export function rust(): LanguageSupport {
	return officialRust();
}
