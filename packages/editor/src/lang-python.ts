import { python as officialPython } from "@codemirror/lang-python";
import type { LanguageSupport } from "@codemirror/language";

export function python(): LanguageSupport {
	return officialPython();
}
