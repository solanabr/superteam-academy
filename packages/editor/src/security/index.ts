import type { CodeEditor } from "../interfaces/code-editor";

export interface SecurityOptions {
	contentSecurityPolicy?: boolean;
	inputSanitization?: boolean;
	executionIsolation?: boolean;
	allowedDomains?: string[];
	maxInputLength?: number;
	allowedTags?: string[];
	allowedAttributes?: string[];
}

export class EditorSecurityManager {
	private editor: CodeEditor | null = null;
	private options: SecurityOptions;
	private cspNonce: string;

	constructor(options: SecurityOptions = {}) {
		this.options = {
			contentSecurityPolicy: true,
			inputSanitization: true,
			executionIsolation: true,
			allowedDomains: ["https://cdn.jsdelivr.net", "https://unpkg.com"],
			maxInputLength: 1_000_000, // 1MB
			allowedTags: ["div", "span", "p", "br", "strong", "em", "code", "pre"],
			allowedAttributes: ["class", "id", "style"],
			...options,
		};

		this.cspNonce = this.generateNonce();
		this.setupCSP();
	}

	setEditor(editor: CodeEditor): void {
		this.editor = editor;
		this.applySecuritySettings();
	}

	updateOptions(options: Partial<SecurityOptions>): void {
		this.options = { ...this.options, ...options };
		this.applySecuritySettings();
	}

	getOptions(): SecurityOptions {
		return { ...this.options };
	}

	private setupCSP(): void {
		if (!this.options.contentSecurityPolicy) return;

		const csp = [
			"default-src 'self'",
			`script-src 'self' 'nonce-${this.cspNonce}' ${this.options.allowedDomains?.join(" ") || ""}`,
			`style-src 'self' 'unsafe-inline' ${this.options.allowedDomains?.join(" ") || ""}`,
			`img-src 'self' data: ${this.options.allowedDomains?.join(" ") || ""}`,
			"font-src 'self' data:",
			"connect-src 'self'",
			"object-src 'none'",
			"base-uri 'self'",
			"form-action 'self'",
		].join("; ");

		const meta = document.createElement("meta");
		meta.httpEquiv = "Content-Security-Policy";
		meta.content = csp;
		document.head.appendChild(meta);
	}

	sanitizeInput(input: string): string {
		if (!this.options.inputSanitization) return input;

		if (input.length > (this.options.maxInputLength || 1_000_000)) {
			throw new Error("Input exceeds maximum allowed length");
		}

		return this.sanitizeHTML(input);
	}

	private sanitizeHTML(html: string): string {
		const allowedTags = this.options.allowedTags || [];
		const allowedAttributes = this.options.allowedAttributes || [];

		let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
		sanitized = sanitized.replace(/on\w+="[^"]*"/gi, "");
		sanitized = sanitized.replace(/on\w+='[^']*'/gi, "");
		sanitized = sanitized.replace(/javascript:/gi, "");

		const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
		sanitized = sanitized.replace(tagRegex, (match, tagName) => {
			if (allowedTags.includes(tagName.toLowerCase())) {
				return match.replace(
					/([a-zA-Z-]+)="[^"]*"/g,
					(attrMatch: string, attrName: string) => {
						return allowedAttributes.includes(attrName.toLowerCase()) ? attrMatch : "";
					}
				);
			}
			return "";
		});

		return sanitized;
	}

	createIsolatedExecutionContext(): Worker {
		if (!this.options.executionIsolation) {
			throw new Error("Execution isolation is disabled");
		}

		const workerCode = `
      self.onmessage = function(e) {
        try {
          // Only allow safe code execution
          const result = eval(e.data.code);
          self.postMessage({ success: true, result });
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      };
    `;

		const blob = new Blob([workerCode], { type: "application/javascript" });
		const worker = new Worker(URL.createObjectURL(blob));

		return worker;
	}

	async executeCodeSafely(code: string, timeout = 5000): Promise<unknown> {
		if (!this.options.executionIsolation) {
			throw new Error("Code execution is not allowed without isolation");
		}

		const sanitizedCode = this.sanitizeCode(code);

		return new Promise((resolve, reject) => {
			const worker = this.createIsolatedExecutionContext();

			const timeoutId = setTimeout(() => {
				worker.terminate();
				reject(new Error("Code execution timed out"));
			}, timeout);

			worker.onmessage = (e) => {
				clearTimeout(timeoutId);
				worker.terminate();

				if (e.data.success) {
					resolve(e.data.result);
				} else {
					reject(new Error(e.data.error));
				}
			};

			worker.postMessage({ code: sanitizedCode });
		});
	}

	private sanitizeCode(code: string): string {
		const dangerousPatterns = [
			/eval\s*\(/g,
			/Function\s*\(/g,
			/setTimeout\s*\(/g,
			/setInterval\s*\(/g,
			/XMLHttpRequest/g,
			/fetch\s*\(/g,
			/import\s*\(/g,
			/require\s*\(/g,
			/process\./g,
			/window\./g,
			/document\./g,
			/localStorage/g,
			/sessionStorage/g,
		];

		let sanitized = code;
		for (const pattern of dangerousPatterns) {
			sanitized = sanitized.replace(pattern, "// DANGEROUS CODE REMOVED: $&");
		}

		return sanitized;
	}

	private generateNonce(): string {
		const array = new Uint8Array(16);
		crypto.getRandomValues(array);
		return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
	}

	private applySecuritySettings(): void {
		if (!this.editor) return;
	}
}

export const InputValidator = {
	validateCodeInput(code: string, language: string): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!code.trim()) {
			errors.push("Code cannot be empty");
		}

		switch (language.toLowerCase()) {
			case "javascript":
			case "typescript":
				if (code.includes("eval(")) {
					errors.push("Use of eval() is not allowed");
				}
				if (code.includes("Function(")) {
					errors.push("Dynamic function creation is not allowed");
				}
				break;
			case "rust":
				if (!code.includes("fn main")) {
					errors.push("Rust code must contain a main function");
				}
				break;
			case "python":
				if (code.includes("exec(")) {
					errors.push("Use of exec() is not allowed");
				}
				if (code.includes("eval(")) {
					errors.push("Use of eval() is not allowed");
				}
				break;
			default:
				break;
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	},

	validateFileUpload(file: File): { valid: boolean; errors: string[] } {
		const errors: string[] = [];
		const maxSize = 10 * 1024 * 1024; // 10MB
		const allowedTypes = [
			"text/plain",
			"text/javascript",
			"text/typescript",
			"text/x-python",
			"text/x-rust",
			"application/json",
		];

		if (file.size > maxSize) {
			errors.push("File size exceeds maximum allowed size (10MB)");
		}

		if (!allowedTypes.includes(file.type) && !file.name.match(/\.(js|ts|py|rs|json|txt)$/)) {
			errors.push("File type not allowed");
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	},
};

export class SecurityAuditLogger {
	private static instance: SecurityAuditLogger;
	private logs: SecurityEvent[] = [];

	static getInstance(): SecurityAuditLogger {
		if (!SecurityAuditLogger.instance) {
			SecurityAuditLogger.instance = new SecurityAuditLogger();
		}
		return SecurityAuditLogger.instance;
	}

	logEvent(event: SecurityEvent): void {
		this.logs.push({
			...event,
			timestamp: new Date().toISOString(),
		});

		console.warn("Security Event:", event);
	}

	getLogs(): SecurityEvent[] {
		return [...this.logs];
	}

	clearLogs(): void {
		this.logs = [];
	}
}

export interface SecurityEvent {
	type: "input_validation" | "code_execution" | "file_upload" | "csp_violation";
	severity: "low" | "medium" | "high" | "critical";
	message: string;
	userId?: string;
	code?: string;
	timestamp?: string;
}
