// Code Splitting Configuration
export interface CodeSplittingConfig {
	routeBased: boolean;
	componentBased: boolean;
	dynamicImports: boolean;
	bundleSizeLimit: number; // in KB
	chunkNaming: "hashed" | "readable" | "custom";
	preloadStrategies: PreloadStrategy[];
}

// Preload Strategy
export interface PreloadStrategy {
	type: "hover" | "visible" | "interaction" | "route";
	selector?: string;
	routes?: string[];
	delay?: number;
}

// Bundle Analyzer
export class BundleAnalyzer {
	private bundles: Map<string, BundleInfo> = new Map();

	// Analyze bundle
	analyzeBundle(bundleName: string, content: string): BundleInfo {
		const size = new Blob([content]).size;
		const gzipSize = this.estimateGzipSize(content);

		const info: BundleInfo = {
			name: bundleName,
			size,
			gzipSize,
			modules: this.extractModules(content),
			dependencies: this.extractDependencies(content),
			chunks: this.analyzeChunks(content),
		};

		this.bundles.set(bundleName, info);
		return info;
	}

	// Get bundle report
	getBundleReport(): BundleReport {
		const bundles = Array.from(this.bundles.values());
		const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
		const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);

		return {
			bundles,
			totalSize,
			totalGzipSize,
			largestBundle: bundles.reduce((max, b) => (b.size > max.size ? b : max)),
			recommendations: this.generateRecommendations(bundles),
		};
	}

	// Check bundle size limits
	checkSizeLimits(config: CodeSplittingConfig): BundleSizeCheck[] {
		const results: BundleSizeCheck[] = [];

		for (const [name, bundle] of this.bundles) {
			const exceedsLimit = bundle.size > config.bundleSizeLimit * 1024;
			results.push({
				bundleName: name,
				size: bundle.size,
				limit: config.bundleSizeLimit * 1024,
				exceedsLimit,
				...(exceedsLimit && { recommendation: this.getSizeRecommendation(bundle) }),
			});
		}

		return results;
	}

	private estimateGzipSize(content: string): number {
		// Simple estimation - in real implementation, use actual gzip compression
		return Math.round(content.length * 0.3);
	}

	private extractModules(content: string): string[] {
		// Extract module names from bundle (simplified)
		const moduleRegex = /"([^"]*\.js)"/g;
		const modules: string[] = [];
		for (const match of content.matchAll(moduleRegex)) {
			modules.push(match[1]);
		}
		return [...new Set(modules)];
	}

	private extractDependencies(content: string): string[] {
		// Extract dependencies from import statements (simplified)
		const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
		const dependencies: string[] = [];
		for (const match of content.matchAll(importRegex)) {
			dependencies.push(match[1]);
		}
		return [...new Set(dependencies)];
	}

	private analyzeChunks(content: string): ChunkInfo[] {
		// Analyze webpack chunks (simplified)
		return [
			{
				id: "main",
				size: content.length,
				modules: this.extractModules(content).length,
			},
		];
	}

	private generateRecommendations(bundles: BundleInfo[]): string[] {
		const recommendations: string[] = [];

		const largeBundles = bundles.filter((b) => b.size > 500 * 1024); // 500KB
		if (largeBundles.length > 0) {
			recommendations.push(
				`Consider splitting large bundles: ${largeBundles.map((b) => b.name).join(", ")}`
			);
		}

		const bundlesWithManyDeps = bundles.filter((b) => b.dependencies.length > 20);
		if (bundlesWithManyDeps.length > 0) {
			recommendations.push(
				"Consider lazy loading dependencies for bundles with many imports"
			);
		}

		return recommendations;
	}

	private getSizeRecommendation(bundle: BundleInfo): string {
		if (bundle.modules.length > 50) {
			return "Split this bundle into smaller chunks based on routes or features";
		}
		if (bundle.dependencies.length > 10) {
			return "Consider code splitting dependencies or using dynamic imports";
		}
		return "Review and optimize bundle content";
	}
}

export interface BundleInfo {
	name: string;
	size: number;
	gzipSize: number;
	modules: string[];
	dependencies: string[];
	chunks: ChunkInfo[];
}

export interface ChunkInfo {
	id: string;
	size: number;
	modules: number;
}

export interface BundleReport {
	bundles: BundleInfo[];
	totalSize: number;
	totalGzipSize: number;
	largestBundle: BundleInfo;
	recommendations: string[];
}

export interface BundleSizeCheck {
	bundleName: string;
	size: number;
	limit: number;
	exceedsLimit: boolean;
	recommendation?: string;
}

// Dynamic Import Manager
export class DynamicImportManager {
	private loadedModules: Map<string, unknown> = new Map();
	private loadingPromises: Map<string, Promise<unknown>> = new Map();

	// Load module dynamically
	async loadModule<T>(
		moduleId: string,
		importFn: () => Promise<T>,
		options: {
			preload?: boolean;
			cache?: boolean;
			timeout?: number;
		} = {}
	): Promise<T> {
		// Check cache first
		if (options.cache !== false && this.loadedModules.has(moduleId)) {
			return this.loadedModules.get(moduleId) as T;
		}

		// Check if already loading
		if (this.loadingPromises.has(moduleId)) {
			return this.loadingPromises.get(moduleId) as Promise<T>;
		}

		// Create loading promise
		const loadPromise = this.performLoad(moduleId, importFn, options);
		this.loadingPromises.set(moduleId, loadPromise);

		try {
			const module = await loadPromise;
			if (options.cache !== false) {
				this.loadedModules.set(moduleId, module);
			}
			return module;
		} finally {
			this.loadingPromises.delete(moduleId);
		}
	}

	// Preload module
	async preloadModule(moduleId: string, importFn: () => Promise<unknown>): Promise<void> {
		if (this.loadedModules.has(moduleId) || this.loadingPromises.has(moduleId)) {
			return;
		}

		try {
			const module = await importFn();
			this.loadedModules.set(moduleId, module);
		} catch (error) {
			console.warn(`Failed to preload module ${moduleId}:`, error);
		}
	}

	// Get loaded modules
	getLoadedModules(): string[] {
		return Array.from(this.loadedModules.keys());
	}

	// Clear cache
	clearCache(moduleId?: string): void {
		if (moduleId) {
			this.loadedModules.delete(moduleId);
		} else {
			this.loadedModules.clear();
		}
	}

	private async performLoad<T>(
		moduleId: string,
		importFn: () => Promise<T>,
		options: { timeout?: number }
	): Promise<T> {
		if (options.timeout) {
			return Promise.race([
				importFn(),
				new Promise<never>((_, reject) =>
					setTimeout(
						() => reject(new Error(`Module ${moduleId} load timeout`)),
						options.timeout
					)
				),
			]);
		}

		return importFn();
	}
}

// Route-based Code Splitting
export class RouteBasedSplitting {
	private routes: Map<string, RouteConfig> = new Map();

	// Register route
	registerRoute(
		route: string,
		config: {
			component: () => Promise<unknown>;
			preload?: boolean;
			priority?: number;
		}
	): void {
		this.routes.set(route, {
			...config,
			loaded: false,
			lastAccessed: 0,
		});
	}

	// Load route component
	async loadRouteComponent(route: string): Promise<unknown> {
		const config = this.routes.get(route);
		if (!config) {
			throw new Error(`Route ${route} not registered`);
		}

		const component = await config.component();
		config.loaded = true;
		config.lastAccessed = Date.now();

		return component;
	}

	// Preload routes
	async preloadRoutes(routes: string[]): Promise<void> {
		const preloadPromises = routes
			.filter((route) => this.routes.has(route))
			.map((route) => {
				const config = this.routes.get(route)!;
				return config.component().then((component) => {
					config.loaded = true;
					config.lastAccessed = Date.now();
					return component;
				});
			});

		await Promise.all(preloadPromises);
	}

	// Get route loading status
	getRouteStatus(route: string): RouteStatus | null {
		const config = this.routes.get(route);
		if (!config) return null;

		return {
			route,
			loaded: config.loaded,
			lastAccessed: config.lastAccessed,
			priority: config.priority || 0,
		};
	}

	// Cleanup unused routes
	cleanupUnusedRoutes(maxAge: number = 30 * 60 * 1000): void {
		// 30 minutes
		const now = Date.now();
		for (const [_route, config] of this.routes) {
			if (config.loaded && now - config.lastAccessed > maxAge) {
				config.loaded = false;
			}
		}
	}
}

interface RouteConfig {
	component: () => Promise<unknown>;
	preload?: boolean;
	priority?: number;
	loaded: boolean;
	lastAccessed: number;
}

export interface RouteStatus {
	route: string;
	loaded: boolean;
	lastAccessed: number;
	priority: number;
}

// Component-based Code Splitting
export class ComponentBasedSplitting {
	private components: Map<string, ComponentConfig> = new Map();

	// Register component
	registerComponent(
		componentId: string,
		config: {
			loader: () => Promise<unknown>;
			preload?: boolean;
			fallback?: unknown;
			errorBoundary?: boolean;
		}
	): void {
		this.components.set(componentId, {
			...config,
			loaded: false,
			loading: false,
			error: null,
		});
	}

	// Load component
	async loadComponent(componentId: string): Promise<unknown> {
		const config = this.components.get(componentId);
		if (!config) {
			throw new Error(`Component ${componentId} not registered`);
		}

		if (config.loaded && config.component) {
			return config.component;
		}

		if (config.loading) {
			return config.loadingPromise;
		}

		config.loading = true;
		config.loadingPromise = this.performComponentLoad(componentId, config);

		try {
			const component = await config.loadingPromise;
			config.component = component;
			config.loaded = true;
			config.error = null;
			return component;
		} catch (error) {
			config.error = error;
			throw error;
		} finally {
			config.loading = false;
			config.loadingPromise = undefined;
		}
	}

	// Preload components
	async preloadComponents(componentIds: string[]): Promise<void> {
		const preloadPromises = componentIds
			.filter((id) => this.components.has(id))
			.map((id) => this.loadComponent(id));

		await Promise.all(preloadPromises);
	}

	// Get component status
	getComponentStatus(componentId: string): ComponentStatus | null {
		const config = this.components.get(componentId);
		if (!config) return null;

		return {
			componentId,
			loaded: config.loaded,
			loading: config.loading,
			error: config.error,
		};
	}

	private async performComponentLoad(
		componentId: string,
		config: ComponentConfig
	): Promise<unknown> {
		try {
			return await config.loader();
		} catch (error) {
			if (config.errorBoundary) {
				console.error(`Failed to load component ${componentId}:`, error);
				return config.fallback || null;
			}
			throw error;
		}
	}
}

interface ComponentConfig {
	loader: () => Promise<unknown>;
	preload?: boolean;
	fallback?: unknown;
	errorBoundary?: boolean;
	loaded: boolean;
	loading: boolean;
	error: unknown;
	component?: unknown;
	loadingPromise?: Promise<unknown> | undefined;
}

export interface ComponentStatus {
	componentId: string;
	loaded: boolean;
	loading: boolean;
	error: unknown;
}

// Lazy Loading Manager
export class LazyLoadingManager {
	private observer: IntersectionObserver | null = null;
	private preloadObserver: IntersectionObserver | null = null;
	private elements: Map<Element, LazyLoadConfig> = new Map();

	constructor() {
		this.initObservers();
	}

	// Register element for lazy loading
	registerElement(
		element: Element,
		config: {
			loadFn: () => Promise<void>;
			preloadDistance?: number;
			rootMargin?: string;
			threshold?: number;
		}
	): void {
		this.elements.set(element, {
			...config,
			loaded: false,
			loading: false,
		});
	}

	// Unregister element
	unregisterElement(element: Element): void {
		this.elements.delete(element);
	}

	// Load element immediately
	async loadElement(element: Element): Promise<void> {
		const config = this.elements.get(element);
		if (!config || config.loaded || config.loading) return;

		config.loading = true;
		try {
			await config.loadFn();
			config.loaded = true;
		} finally {
			config.loading = false;
		}
	}

	// Preload element
	async preloadElement(element: Element): Promise<void> {
		const config = this.elements.get(element);
		if (!config || config.loaded) return;

		try {
			await config.loadFn();
			config.loaded = true;
		} catch (error) {
			console.warn("Preload failed:", error);
		}
	}

	// Get loading status
	getElementStatus(element: Element): LazyLoadStatus | null {
		const config = this.elements.get(element);
		if (!config) return null;

		return {
			loaded: config.loaded,
			loading: config.loading,
		};
	}

	// Cleanup
	destroy(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
		if (this.preloadObserver) {
			this.preloadObserver.disconnect();
			this.preloadObserver = null;
		}
		this.elements.clear();
	}

	private initObservers(): void {
		// Main intersection observer for loading
		this.observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						this.loadElement(entry.target);
					}
				});
			},
			{ rootMargin: "50px" }
		);

		// Preload observer for preloading
		this.preloadObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						this.preloadElement(entry.target);
					}
				});
			},
			{ rootMargin: "200px" }
		);

		// Observe all registered elements
		for (const element of this.elements.keys()) {
			this.observer.observe(element);
			this.preloadObserver.observe(element);
		}
	}
}

interface LazyLoadConfig {
	loadFn: () => Promise<void>;
	preloadDistance?: number;
	rootMargin?: string;
	threshold?: number;
	loaded: boolean;
	loading: boolean;
}

export interface LazyLoadStatus {
	loaded: boolean;
	loading: boolean;
}

// Code Splitting Factory
export const CodeSplittingFactory = {
	createBundleAnalyzer(): BundleAnalyzer {
		return new BundleAnalyzer();
	},

	createDynamicImportManager(): DynamicImportManager {
		return new DynamicImportManager();
	},

	createRouteBasedSplitting(): RouteBasedSplitting {
		return new RouteBasedSplitting();
	},

	createComponentBasedSplitting(): ComponentBasedSplitting {
		return new ComponentBasedSplitting();
	},

	createLazyLoadingManager(): LazyLoadingManager {
		return new LazyLoadingManager();
	},
};
