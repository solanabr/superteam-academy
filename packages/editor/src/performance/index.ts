import type { CodeEditor } from "../interfaces/code-editor";

export interface PerformanceOptions {
	lazyLoading?: boolean;
	codeSplitting?: boolean;
	memoryManagement?: boolean;
	virtualization?: boolean;
	debouncedUpdates?: boolean;
	maxFileSize?: number;
	preloadCommonLanguages?: boolean;
}

export class EditorPerformanceManager {
	private editor: CodeEditor | null = null;
	private options: PerformanceOptions;
	private loadedModules: Map<string, unknown> = new Map();
	private memoryUsage: Map<string, number> = new Map();
	private updateQueue: Array<() => void> = [];
	private isUpdating = false;

	constructor(options: PerformanceOptions = {}) {
		this.options = {
			lazyLoading: true,
			codeSplitting: true,
			memoryManagement: true,
			virtualization: true,
			debouncedUpdates: true,
			maxFileSize: 1024 * 1024, // 1MB
			preloadCommonLanguages: true,
			...options,
		};

		if (this.options.preloadCommonLanguages) {
			this.preloadCommonLanguages();
		}
	}

	setEditor(editor: CodeEditor): void {
		this.editor = editor;
		this.applyPerformanceSettings();
	}

	updateOptions(options: Partial<PerformanceOptions>): void {
		this.options = { ...this.options, ...options };
		this.applyPerformanceSettings();
	}

	getOptions(): PerformanceOptions {
		return { ...this.options };
	}

	// Lazy loading for editor modules
	async loadModule(moduleName: string): Promise<unknown> {
		if (this.loadedModules.has(moduleName)) {
			return this.loadedModules.get(moduleName);
		}

		if (!this.options.lazyLoading) {
			throw new Error("Lazy loading is disabled");
		}

		try {
			let module: unknown;

			switch (moduleName) {
				case "monaco":
					module = await this.loadMonacoEditor();
					break;
				case "codemirror":
					module = await this.loadCodeMirror();
					break;
				case "typescript":
					module = await this.loadTypeScript();
					break;
				case "rust":
					module = await this.loadRust();
					break;
				case "python":
					module = await this.loadPython();
					break;
				default:
					throw new Error(`Unknown module: ${moduleName}`);
			}

			this.loadedModules.set(moduleName, module);
			this.trackMemoryUsage(moduleName, this.estimateModuleSize(module));

			return module;
		} catch (error) {
			console.error(`Failed to load module ${moduleName}:`, error);
			throw error;
		}
	}

	// Code splitting for large files
	async splitLargeFile(content: string): Promise<string[]> {
		if (!this.options.codeSplitting) {
			return [content];
		}

		const maxChunkSize = 50_000; // 50KB chunks
		const chunks: string[] = [];

		if (content.length <= maxChunkSize) {
			return [content];
		}

		// Split by logical boundaries (functions, classes, etc.)
		const lines = content.split("\n");
		let currentChunk = "";
		let braceCount = 0;
		let parenCount = 0;

		for (const line of lines) {
			currentChunk += `${line}\n`;

			// Count braces and parentheses to avoid splitting inside blocks
			braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
			parenCount += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;

			if (currentChunk.length >= maxChunkSize && braceCount === 0 && parenCount === 0) {
				chunks.push(currentChunk.trim());
				currentChunk = "";
				braceCount = 0;
				parenCount = 0;
			}
		}

		if (currentChunk.trim()) {
			chunks.push(currentChunk.trim());
		}

		return chunks;
	}

	// Memory management
	trackMemoryUsage(component: string, size: number): void {
		if (!this.options.memoryManagement) return;

		this.memoryUsage.set(component, size);

		// Check if we need to free memory
		const totalMemory = Array.from(this.memoryUsage.values()).reduce((sum, s) => sum + s, 0);
		const maxMemory = 50 * 1024 * 1024; // 50MB limit

		if (totalMemory > maxMemory) {
			this.freeMemory();
		}
	}

	private freeMemory(): void {
		// Free least recently used modules
		const entries = Array.from(this.loadedModules.entries());
		const toRemove = entries.slice(0, Math.ceil(entries.length / 2));

		toRemove.forEach(([name]) => {
			this.loadedModules.delete(name);
			this.memoryUsage.delete(name);
		});

		// Force garbage collection if available
		if (window.gc) {
			window.gc();
		}
	}

	// Debounced updates
	queueUpdate(updateFn: () => void): void {
		this.updateQueue.push(updateFn);

		if (!this.isUpdating) {
			this.processUpdateQueue();
		}
	}

	private async processUpdateQueue(): Promise<void> {
		if (this.isUpdating || this.updateQueue.length === 0) return;

		this.isUpdating = true;

		while (this.updateQueue.length > 0) {
			// biome-ignore lint/style/noNonNullAssertion: length check guarantees element exists
			const updateFn = this.updateQueue.shift()!;
			await updateFn();

			// Small delay to prevent blocking the main thread
			await new Promise((resolve) => setTimeout(resolve, 16)); // ~60fps
		}

		this.isUpdating = false;
	}

	// Virtualization for large files
	createVirtualizedView(content: string): VirtualizedContent {
		if (!this.options.virtualization) {
			return {
				lines: content.split("\n"),
				visibleRange: { start: 0, end: content.split("\n").length },
				renderLine: (index: number) => content.split("\n")[index] || "",
			};
		}

		const lines = content.split("\n");
		const viewportHeight = 20; // Assume 20 visible lines

		return {
			lines,
			visibleRange: { start: 0, end: Math.min(viewportHeight, lines.length) },
			renderLine: (index: number) => lines[index] || "",
			scrollTo: (line: number) => {
				const start = Math.max(0, line - viewportHeight / 2);
				const end = Math.min(lines.length, start + viewportHeight);
				return { start, end };
			},
		};
	}

	// Performance monitoring
	getPerformanceMetrics(): PerformanceMetrics {
		const memoryInfo = (performance as unknown as Record<string, unknown>).memory as
			| Record<string, number>
			| undefined;

		return {
			memoryUsage: this.memoryUsage,
			totalMemoryUsed: Array.from(this.memoryUsage.values()).reduce(
				(sum, size) => sum + size,
				0
			),
			heapUsed: memoryInfo?.usedJSHeapSize || 0,
			heapTotal: memoryInfo?.totalJSHeapSize || 0,
			heapLimit: memoryInfo?.jsHeapSizeLimit || 0,
			loadedModules: Array.from(this.loadedModules.keys()),
			updateQueueLength: this.updateQueue.length,
		};
	}

	private async loadMonacoEditor(): Promise<unknown> {
		// Dynamic import for Monaco Editor
		const monaco = await import("monaco-editor");
		return monaco;
	}

	private async loadCodeMirror(): Promise<unknown> {
		// Dynamic import for CodeMirror
		const { EditorView } = await import("@codemirror/view");
		const { basicSetup } = await import("codemirror");
		const { javascript } = await import("@codemirror/lang-javascript");
		return { EditorView, basicSetup, javascript };
	}

	private async loadTypeScript(): Promise<unknown> {
		// Load TypeScript language support
		const ts = await import("typescript");
		return ts;
	}

	private async loadRust(): Promise<unknown> {
		// Load Rust language support (would need a Rust language plugin)
		return {}; // Placeholder
	}

	private async loadPython(): Promise<unknown> {
		// Load Python language support (would need a Python language plugin)
		return {}; // Placeholder
	}

	private preloadCommonLanguages(): void {
		// Preload commonly used languages
		setTimeout(() => {
			this.loadModule("typescript").catch(() => {
				/* ignored */
			});
			this.loadModule("javascript").catch(() => {
				/* ignored */
			});
		}, 1000);
	}

	private estimateModuleSize(module: unknown): number {
		// Rough estimation of module size
		return JSON.stringify(module).length * 2; // Assume UTF-16 encoding
	}

	private applyPerformanceSettings(): void {
		if (!this.editor) return;

		// Apply performance settings to the editor
		// This would need to be implemented in the specific editor implementations
	}
}

export interface VirtualizedContent {
	lines: string[];
	visibleRange: { start: number; end: number };
	renderLine: (index: number) => string;
	scrollTo?: (line: number) => { start: number; end: number };
}

export interface PerformanceMetrics {
	memoryUsage: Map<string, number>;
	totalMemoryUsed: number;
	heapUsed: number;
	heapTotal: number;
	heapLimit: number;
	loadedModules: string[];
	updateQueueLength: number;
}

// Performance monitoring utilities
export class PerformanceMonitor {
	private static instance: PerformanceMonitor;
	private metrics: PerformanceMetrics[] = [];
	private observers: Set<(metrics: PerformanceMetrics) => void> = new Set();

	static getInstance(): PerformanceMonitor {
		if (!PerformanceMonitor.instance) {
			PerformanceMonitor.instance = new PerformanceMonitor();
		}
		return PerformanceMonitor.instance;
	}

	recordMetrics(metrics: PerformanceMetrics): void {
		this.metrics.push(metrics);

		// Keep only last 100 metrics
		if (this.metrics.length > 100) {
			this.metrics.shift();
		}

		// Notify observers
		this.observers.forEach((observer) => {
			observer(metrics);
		});
	}

	getAverageMetrics(): Partial<PerformanceMetrics> {
		if (this.metrics.length === 0) return {};

		const latest = this.metrics[this.metrics.length - 1];
		return {
			totalMemoryUsed:
				this.metrics.reduce((sum, m) => sum + m.totalMemoryUsed, 0) / this.metrics.length,
			heapUsed: latest.heapUsed,
			heapTotal: latest.heapTotal,
			heapLimit: latest.heapLimit,
		};
	}

	addObserver(callback: (metrics: PerformanceMetrics) => void): () => void {
		this.observers.add(callback);
		return () => this.observers.delete(callback);
	}

	clearMetrics(): void {
		this.metrics = [];
	}
}

// Lazy loading utilities
export const LazyLoader = {
	cache: new Map<string, Promise<unknown>>(),

	async loadScript(src: string): Promise<void> {
		if (LazyLoader.cache.has(src)) {
			return LazyLoader.cache.get(src) as Promise<void>;
		}

		const promise = new Promise<void>((resolve, reject) => {
			const script = document.createElement("script");
			script.src = src;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
			document.head.appendChild(script);
		});

		LazyLoader.cache.set(src, promise);
		return promise;
	},

	async loadStyle(href: string): Promise<void> {
		if (LazyLoader.cache.has(href)) {
			return LazyLoader.cache.get(href) as Promise<void>;
		}

		const promise = new Promise<void>((resolve, reject) => {
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = href;
			link.onload = () => resolve();
			link.onerror = () => reject(new Error(`Failed to load style: ${href}`));
			document.head.appendChild(link);
		});

		LazyLoader.cache.set(href, promise);
		return promise;
	},

	clearCache(): void {
		LazyLoader.cache.clear();
	},
};
