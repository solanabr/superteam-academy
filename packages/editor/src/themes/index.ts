import type { EditorTheme } from "../interfaces/code-editor";

export const EDITOR_THEMES: EditorTheme[] = [
	{
		name: "vs-dark",
		displayName: "Dark",
		isDark: true,
		colors: {
			background: "#1e1e1e",
			foreground: "#d4d4d4",
			selection: "#264f78",
			lineHighlight: "#2d2d30",
			cursor: "#aeafad",
		},
	},
	{
		name: "vs-light",
		displayName: "Light",
		isDark: false,
		colors: {
			background: "#ffffff",
			foreground: "#000000",
			selection: "#add6ff",
			lineHighlight: "#f0f0f0",
			cursor: "#000000",
		},
	},
	{
		name: "hc-black",
		displayName: "High Contrast Dark",
		isDark: true,
		colors: {
			background: "#000000",
			foreground: "#ffffff",
			selection: "#ffffff",
			lineHighlight: "#0f0f23",
			cursor: "#ffffff",
		},
	},
	{
		name: "hc-light",
		displayName: "High Contrast Light",
		isDark: false,
		colors: {
			background: "#ffffff",
			foreground: "#000000",
			selection: "#000000",
			lineHighlight: "#0f0f23",
			cursor: "#000000",
		},
	},
];

export const SOLANA_THEMES: EditorTheme[] = [
	{
		name: "solana-dark",
		displayName: "Solana Dark",
		isDark: true,
		colors: {
			background: "#0a0a0a",
			foreground: "#e6e6e6",
			selection: "#9945ff",
			lineHighlight: "#1a1a1a",
			cursor: "#9945ff",
		},
	},
	{
		name: "solana-purple",
		displayName: "Solana Purple",
		isDark: true,
		colors: {
			background: "#1a0033",
			foreground: "#ffffff",
			selection: "#9945ff",
			lineHighlight: "#2a0044",
			cursor: "#9945ff",
		},
	},
];

export const ALL_THEMES = [...EDITOR_THEMES, ...SOLANA_THEMES];

export function getThemeByName(name: string): EditorTheme | undefined {
	return ALL_THEMES.find((theme) => theme.name === name);
}

export function getDarkThemes(): EditorTheme[] {
	return ALL_THEMES.filter((theme) => theme.isDark);
}

export function getLightThemes(): EditorTheme[] {
	return ALL_THEMES.filter((theme) => !theme.isDark);
}

export function getDefaultTheme(): EditorTheme {
	return EDITOR_THEMES[0]; // vs-dark
}
