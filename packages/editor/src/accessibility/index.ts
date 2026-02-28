import type { CodeEditor } from "../interfaces/code-editor";

export interface AccessibilityOptions {
	screenReaderSupport?: boolean;
	highContrastMode?: boolean;
	keyboardNavigation?: boolean;
	focusIndicators?: boolean;
	reducedMotion?: boolean;
	fontSize?: number;
	lineHeight?: number;
}

export class EditorAccessibilityManager {
	private editor: CodeEditor | null = null;
	private options: AccessibilityOptions;

	constructor(options: AccessibilityOptions = {}) {
		this.options = {
			screenReaderSupport: true,
			highContrastMode: false,
			keyboardNavigation: true,
			focusIndicators: true,
			reducedMotion: false,
			fontSize: 14,
			lineHeight: 1.5,
			...options,
		};

		this.detectSystemPreferences();
	}

	setEditor(editor: CodeEditor): void {
		this.editor = editor;
		this.applyAccessibilitySettings();
	}

	updateOptions(options: Partial<AccessibilityOptions>): void {
		this.options = { ...this.options, ...options };
		this.applyAccessibilitySettings();
	}

	getOptions(): AccessibilityOptions {
		return { ...this.options };
	}

	announce(message: string, priority: "polite" | "assertive" = "polite"): void {
		if (!this.options.screenReaderSupport) return;

		const announcement = document.createElement("div");
		announcement.setAttribute("aria-live", priority);
		announcement.setAttribute("aria-atomic", "true");
		announcement.style.position = "absolute";
		announcement.style.left = "-10000px";
		announcement.style.width = "1px";
		announcement.style.height = "1px";
		announcement.style.overflow = "hidden";

		announcement.textContent = message;
		document.body.appendChild(announcement);

		setTimeout(() => {
			document.body.removeChild(announcement);
		}, 1000);
	}

	focusEditor(): void {
		if (this.editor) {
			this.editor.focus();
			this.announce("Editor focused");
		}
	}

	handleKeydown(event: KeyboardEvent): boolean {
		if (!this.options.keyboardNavigation) return false;

		switch (event.key) {
			case "Escape":
				this.announce("Exited editor mode");
				return true;
			case "Tab":
				if (event.shiftKey) {
					this.announce("Moving to previous element");
				} else {
					this.announce("Moving to next element");
				}
				return false; // Allow default tab behavior
			default:
				return false;
		}
	}

	private detectSystemPreferences(): void {
		if (window.matchMedia?.("(prefers-contrast: high)").matches) {
			this.options.highContrastMode = true;
		}

		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
			this.options.reducedMotion = true;
		}

		if (
			navigator.userAgent.includes("NVDA") ||
			navigator.userAgent.includes("JAWS") ||
			navigator.userAgent.includes("VoiceOver")
		) {
			this.options.screenReaderSupport = true;
		}
	}

	private applyAccessibilitySettings(): void {
		if (!this.editor) return;

		this.addAriaAttributes();

		this.setupKeyboardListeners();
	}

	private addAriaAttributes(): void {
		/* noop */
	}

	private setupKeyboardListeners(): void {
		if (!this.options.keyboardNavigation) return;

		document.addEventListener("keydown", this.handleKeydown.bind(this));
	}
}

export const WCAGComplianceChecker = {
	checkColorContrast(_foreground: string, _background: string): boolean {
		return true; // Placeholder
	},

	validateFocusableElements(container: HTMLElement): boolean {
		const focusableElements = container.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);

		for (const element of Array.from(focusableElements)) {
			const rect = element.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) {
				return false; // Invisible focusable element
			}
		}

		return true;
	},

	checkHeadingHierarchy(container: HTMLElement): boolean {
		const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
		let lastLevel = 0;

		for (const heading of Array.from(headings)) {
			const level = parseInt(heading.tagName.charAt(1), 10);
			if (level - lastLevel > 1) {
				return false; // Skipped heading level
			}
			lastLevel = level;
		}

		return true;
	},
};

export class AccessibleKeybindingManager {
	private keybindings: Map<string, { callback: () => void; description: string }> = new Map();

	addKeybinding(key: string, callback: () => void, description: string): void {
		this.keybindings.set(key, { callback, description });
	}

	announceKeybinding(key: string): void {
		const binding = this.keybindings.get(key);
		if (binding) {
			const announcement = document.createElement("div");
			announcement.setAttribute("aria-live", "polite");
			announcement.textContent = `Shortcut: ${key} - ${binding.description}`;
			announcement.style.position = "absolute";
			announcement.style.left = "-10000px";
			document.body.appendChild(announcement);

			setTimeout(() => {
				document.body.removeChild(announcement);
			}, 3000);
		}
	}

	executeKeybinding(key: string): boolean {
		const binding = this.keybindings.get(key);
		if (binding) {
			binding.callback();
			return true;
		}
		return false;
	}
}
