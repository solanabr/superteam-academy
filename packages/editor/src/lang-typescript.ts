import { javascript } from "@codemirror/lang-javascript";
import type { LanguageSupport } from "@codemirror/language";

export function typescript(): LanguageSupport {
	return javascript({ typescript: true, jsx: true });
}
