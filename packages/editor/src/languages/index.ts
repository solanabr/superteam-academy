export interface EditorLanguage {
	id: string;
	displayName: string;
	extensions: string[];
	aliases?: string[];
}

export const SUPPORTED_LANGUAGES: EditorLanguage[] = [
	{
		id: "typescript",
		displayName: "TypeScript",
		extensions: [".ts", ".tsx"],
		aliases: ["ts", "typescript"],
	},
	{
		id: "javascript",
		displayName: "JavaScript",
		extensions: [".js", ".jsx", ".mjs"],
		aliases: ["js", "javascript"],
	},
	{
		id: "rust",
		displayName: "Rust",
		extensions: [".rs"],
		aliases: ["rust"],
	},
	{
		id: "json",
		displayName: "JSON",
		extensions: [".json"],
		aliases: ["json"],
	},
	{
		id: "markdown",
		displayName: "Markdown",
		extensions: [".md", ".markdown"],
		aliases: ["md", "markdown"],
	},
	{
		id: "solana",
		displayName: "Solana Program",
		extensions: [".rs"],
		aliases: ["solana", "anchor"],
	},
];

export function getLanguageById(id: string): EditorLanguage | undefined {
	return SUPPORTED_LANGUAGES.find((lang) => lang.id === id);
}

export function getLanguageByExtension(extension: string): EditorLanguage | undefined {
	return SUPPORTED_LANGUAGES.find((lang) => lang.extensions.some((ext) => ext === extension));
}

export function getLanguageByAlias(alias: string): EditorLanguage | undefined {
	return SUPPORTED_LANGUAGES.find((lang) => lang.aliases?.includes(alias));
}

export function detectLanguage(filename: string): EditorLanguage | undefined {
	const extension = filename.substring(filename.lastIndexOf("."));
	return getLanguageByExtension(extension);
}

export function getDefaultLanguage(): EditorLanguage {
	return SUPPORTED_LANGUAGES[0]; // TypeScript
}
