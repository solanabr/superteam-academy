// Bundle Analysis Types
export interface BundleAnalysis {
	totalSize: number;
	gzippedSize: number;
	brotliSize?: number;
	chunks: BundleChunk[];
	assets: BundleAsset[];
	dependencies: DependencyInfo[];
	recommendations: string[];
}

export interface BundleChunk {
	id: string;
	name: string;
	size: number;
	gzippedSize: number;
	modules: BundleModule[];
	entry: boolean;
	initial: boolean;
}

export interface BundleModule {
	id: string;
	name: string;
	size: number;
	dependencies: string[];
	reasons: string[];
}

export interface BundleAsset {
	name: string;
	size: number;
	gzippedSize: number;
	type: "js" | "css" | "image" | "font" | "other";
	chunks: string[];
}

export interface DependencyInfo {
	name: string;
	version: string;
	size: number;
	used: boolean;
	duplicates: number;
	alternatives?: string[];
}

// Bundler Stats Interfaces
interface WebpackChunkStats {
	id: number | string;
	names?: string[];
	size: number;
	modules?: WebpackModuleStats[];
	entry: boolean;
	initial: boolean;
}

interface WebpackModuleStats {
	id: number | string;
	name?: string;
	identifier?: string;
	size: number;
	dependencies?: (string | number)[];
	reasons?: (string | number)[];
}

interface WebpackAssetStats {
	name: string;
	size: number;
	chunks?: (string | number)[];
}

interface RollupChunkStats {
	fileName: string;
	name?: string;
	size: number;
	modules?: RollupModuleStats[];
	isEntry: boolean;
}

interface RollupModuleStats {
	id: string;
	name: string;
	size: number;
	dependencies?: string[];
	reasons?: string[];
}

interface RollupAssetStats {
	fileName: string;
	size: number;
	chunks?: string[];
}

interface BundlerStats {
	chunks?: unknown[];
	assets?: unknown[];
}

// Bundle Analyzer
export class BundleAnalyzer {
	// Analyze webpack bundle
	analyzeWebpack(stats: unknown): BundleAnalysis {
		return this.analyzeStats(stats, "webpack");
	}

	// Analyze rollup bundle
	analyzeRollup(stats: unknown): BundleAnalysis {
		return this.analyzeStats(stats, "rollup");
	}

	// Analyze vite bundle
	analyzeVite(stats: unknown): BundleAnalysis {
		return this.analyzeStats(stats, "vite");
	}

	// Generic bundle analysis
	private analyzeStats(stats: unknown, bundler: string): BundleAnalysis {
		const chunks = this.extractChunks(stats, bundler);
		const assets = this.extractAssets(stats, bundler);
		const dependencies = this.extractDependencies(stats, bundler);

		const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
		const gzippedSize = assets.reduce((sum, asset) => sum + asset.gzippedSize, 0);

		return {
			totalSize,
			gzippedSize,
			chunks,
			assets,
			dependencies,
			recommendations: this.generateRecommendations(chunks, assets, dependencies),
		};
	}

	// Extract chunks from bundle stats
	private extractChunks(stats: unknown, bundler: string): BundleChunk[] {
		switch (bundler) {
			case "webpack":
				return this.extractWebpackChunks(stats);
			case "rollup":
				return this.extractRollupChunks(stats);
			case "vite":
				return this.extractViteChunks(stats);
			default:
				return [];
		}
	}

	private extractWebpackChunks(stats: unknown): BundleChunk[] {
		const typedStats = stats as BundlerStats;
		if (!typedStats.chunks) return [];

		return (typedStats.chunks as WebpackChunkStats[]).map((chunk) => ({
			id: chunk.id.toString(),
			name: chunk.names?.[0] || `chunk-${chunk.id}`,
			size: chunk.size,
			gzippedSize: this.estimateGzipSize(chunk.size),
			modules: this.extractWebpackModules(chunk.modules || []),
			entry: chunk.entry,
			initial: chunk.initial,
		}));
	}

	private extractRollupChunks(stats: unknown): BundleChunk[] {
		const typedStats = stats as BundlerStats;
		if (!typedStats.chunks) return [];

		return (typedStats.chunks as RollupChunkStats[]).map((chunk) => ({
			id: chunk.fileName,
			name: chunk.name || chunk.fileName,
			size: chunk.size,
			gzippedSize: this.estimateGzipSize(chunk.size),
			modules: this.extractRollupModules(chunk.modules || []),
			entry: chunk.isEntry,
			initial: chunk.isEntry,
		}));
	}

	private extractViteChunks(stats: unknown): BundleChunk[] {
		// Vite uses similar structure to Rollup
		return this.extractRollupChunks(stats);
	}

	// Extract modules from chunks
	private extractWebpackModules(modules: WebpackModuleStats[]): BundleModule[] {
		return modules.map((module) => ({
			id: module.id.toString(),
			name: module.name || module.identifier || "",
			size: module.size,
			dependencies: module.dependencies?.map((d) => d.toString()) || [],
			reasons: module.reasons?.map((r) => r.toString()) || [],
		}));
	}

	private extractRollupModules(modules: RollupModuleStats[]): BundleModule[] {
		return modules.map((module) => ({
			id: module.id,
			name: module.name,
			size: module.size,
			dependencies: module.dependencies || [],
			reasons: module.reasons || [],
		}));
	}

	// Extract assets
	private extractAssets(stats: unknown, bundler: string): BundleAsset[] {
		switch (bundler) {
			case "webpack":
				return this.extractWebpackAssets(stats);
			case "rollup":
				return this.extractRollupAssets(stats);
			case "vite":
				return this.extractViteAssets(stats);
			default:
				return [];
		}
	}

	private extractWebpackAssets(stats: unknown): BundleAsset[] {
		const typedStats = stats as BundlerStats;
		if (!typedStats.assets) return [];

		return (typedStats.assets as WebpackAssetStats[]).map((asset) => ({
			name: asset.name,
			size: asset.size,
			gzippedSize: this.estimateGzipSize(asset.size),
			type: this.getAssetType(asset.name),
			chunks: asset.chunks?.map((c) => c.toString()) || [],
		}));
	}

	private extractRollupAssets(stats: unknown): BundleAsset[] {
		const typedStats = stats as BundlerStats;
		if (!typedStats.assets) return [];

		return (typedStats.assets as RollupAssetStats[]).map((asset) => ({
			name: asset.fileName,
			size: asset.size,
			gzippedSize: this.estimateGzipSize(asset.size),
			type: this.getAssetType(asset.fileName),
			chunks: asset.chunks || [],
		}));
	}

	private extractViteAssets(stats: unknown): BundleAsset[] {
		return this.extractRollupAssets(stats);
	}

	// Extract dependencies
	private extractDependencies(_stats: unknown, _bundler: string): DependencyInfo[] {
		// This would typically come from package.json analysis
		// For now, return empty array - would need additional analysis
		return [];
	}

	// Get asset type from filename
	private getAssetType(filename: string): BundleAsset["type"] {
		if (filename.endsWith(".js")) return "js";
		if (filename.endsWith(".css")) return "css";
		if (/\.(png|jpg|jpeg|gif|svg|webp|avif)$/i.test(filename)) return "image";
		if (/\.(woff|woff2|ttf|eot)$/i.test(filename)) return "font";
		return "other";
	}

	// Estimate gzip size (rough approximation)
	private estimateGzipSize(size: number): number {
		// Gzip typically compresses text by 60-80%
		// This is a rough estimate
		return Math.round(size * 0.7);
	}

	// Generate optimization recommendations
	private generateRecommendations(
		chunks: BundleChunk[],
		assets: BundleAsset[],
		dependencies: DependencyInfo[]
	): string[] {
		const recommendations: string[] = [];

		// Check for large chunks
		const largeChunks = chunks.filter((chunk) => chunk.size > 500 * 1024); // 500KB
		if (largeChunks.length > 0) {
			recommendations.push(
				`Consider code splitting: ${largeChunks.map((c) => c.name).join(", ")} are over 500KB`
			);
		}

		// Check for unused dependencies
		const unusedDeps = dependencies.filter((dep) => !dep.used);
		if (unusedDeps.length > 0) {
			recommendations.push(
				`Remove unused dependencies: ${unusedDeps.map((d) => d.name).join(", ")}`
			);
		}

		// Check for duplicate dependencies
		const duplicates = dependencies.filter((dep) => dep.duplicates > 1);
		if (duplicates.length > 0) {
			recommendations.push(
				`Resolve duplicate dependencies: ${duplicates.map((d) => d.name).join(", ")}`
			);
		}

		// Check for large assets
		const largeAssets = assets.filter((asset) => asset.size > 1000 * 1024); // 1MB
		if (largeAssets.length > 0) {
			recommendations.push(
				`Optimize large assets: ${largeAssets.map((a) => a.name).join(", ")} are over 1MB`
			);
		}

		return recommendations;
	}
}

// Code Splitting Manager
export class CodeSplittingManager {
	private splitPoints: Map<string, SplitPoint> = new Map();
	private dynamicImports: Map<string, DynamicImport> = new Map();

	// Define split point
	defineSplitPoint(
		name: string,
		config: {
			condition: () => boolean;
			priority: "high" | "medium" | "low";
			preload?: boolean;
			prefetch?: boolean;
		}
	): void {
		this.splitPoints.set(name, {
			name,
			condition: config.condition,
			priority: config.priority,
			...(config.preload !== undefined && { preload: config.preload }),
			...(config.prefetch !== undefined && { prefetch: config.prefetch }),
			modules: [],
			loaded: false,
		});
	}

	// Register dynamic import
	registerDynamicImport(
		id: string,
		importFn: () => Promise<unknown>,
		config: {
			splitPoint?: string;
			preload?: boolean;
			prefetch?: boolean;
			timeout?: number;
		}
	): void {
		this.dynamicImports.set(id, {
			id,
			importFn,
			...(config.splitPoint !== undefined && { splitPoint: config.splitPoint }),
			...(config.preload !== undefined && { preload: config.preload }),
			...(config.prefetch !== undefined && { prefetch: config.prefetch }),
			...(config.timeout !== undefined && { timeout: config.timeout }),
			loaded: false,
			loading: false,
		});
	}

	// Load split point
	async loadSplitPoint(name: string): Promise<void> {
		const splitPoint = this.splitPoints.get(name);
		if (!splitPoint || splitPoint.loaded) return;

		// Check condition
		if (!splitPoint.condition()) {
			return;
		}

		// Load associated dynamic imports
		const imports = Array.from(this.dynamicImports.values()).filter(
			(imp) => imp.splitPoint === name
		);

		await Promise.all(imports.map((imp) => this.loadDynamicImport(imp.id)));

		splitPoint.loaded = true;
	}

	// Load dynamic import
	async loadDynamicImport(id: string): Promise<unknown> {
		const importConfig = this.dynamicImports.get(id);
		if (!importConfig) return undefined;
		if (importConfig.loaded) return importConfig.module;

		if (importConfig.loading) {
			return importConfig.loadingPromise;
		}

		importConfig.loading = true;

		try {
			importConfig.loadingPromise = Promise.race([
				importConfig.importFn(),
				new Promise((_, reject) =>
					setTimeout(
						() => reject(new Error("Import timeout")),
						importConfig.timeout || 10_000
					)
				),
			]);

			const module = await importConfig.loadingPromise;
			importConfig.module = module;
			importConfig.loaded = true;
			importConfig.loading = false;

			return module;
		} catch (error) {
			importConfig.loading = false;
			throw error;
		}
	}

	// Preload critical split points
	async preloadCritical(): Promise<void> {
		const critical = Array.from(this.splitPoints.values()).filter(
			(sp) => sp.priority === "high" && sp.condition()
		);

		await Promise.all(critical.map((sp) => this.loadSplitPoint(sp.name)));
	}

	// Prefetch on idle
	prefetchOnIdle(): void {
		if (typeof window === "undefined" || !("requestIdleCallback" in window)) return;

		window.requestIdleCallback(() => {
			const prefetch = Array.from(this.splitPoints.values()).filter(
				(sp) => sp.prefetch && !sp.loaded && sp.condition()
			);

			prefetch.forEach((sp) => {
				this.loadSplitPoint(sp.name).catch(console.warn);
			});
		});
	}

	// Get loading status
	getLoadingStatus(): CodeSplittingStatus {
		const splitPoints = Array.from(this.splitPoints.values()).map((sp) => ({
			name: sp.name,
			loaded: sp.loaded,
			priority: sp.priority,
		}));

		const dynamicImports = Array.from(this.dynamicImports.values()).map((imp) => ({
			id: imp.id,
			loaded: imp.loaded,
			loading: imp.loading,
			...(imp.splitPoint !== undefined && { splitPoint: imp.splitPoint }),
		}));

		return {
			splitPoints,
			dynamicImports,
			overallProgress: this.calculateProgress(),
		};
	}

	// Calculate overall loading progress
	private calculateProgress(): number {
		const allItems = [
			...Array.from(this.splitPoints.values()),
			...Array.from(this.dynamicImports.values()),
		];

		if (allItems.length === 0) return 100;

		const loaded = allItems.filter((item) => item.loaded).length;
		return Math.round((loaded / allItems.length) * 100);
	}
}

interface SplitPoint {
	name: string;
	condition: () => boolean;
	priority: "high" | "medium" | "low";
	preload?: boolean;
	prefetch?: boolean;
	modules: string[];
	loaded: boolean;
}

interface DynamicImport {
	id: string;
	importFn: () => Promise<unknown>;
	splitPoint?: string;
	preload?: boolean;
	prefetch?: boolean;
	timeout?: number;
	loaded: boolean;
	loading: boolean;
	loadingPromise?: Promise<unknown>;
	module?: unknown;
}

export interface CodeSplittingStatus {
	splitPoints: Array<{
		name: string;
		loaded: boolean;
		priority: string;
	}>;
	dynamicImports: Array<{
		id: string;
		loaded: boolean;
		loading: boolean;
		splitPoint?: string;
	}>;
	overallProgress: number;
}

// Tree Shaking Optimizer
export class TreeShakingOptimizer {
	private usedExports: Set<string> = new Set();
	private availableExports: Map<string, string[]> = new Map();

	// Track used exports
	trackUsage(module: string, exports: string[]): void {
		exports.forEach((exp) => {
			this.usedExports.add(`${module}:${exp}`);
		});
	}

	// Register available exports
	registerExports(module: string, exports: string[]): void {
		this.availableExports.set(module, exports);
	}

	// Analyze tree shaking opportunities
	analyzeTreeShaking(): TreeShakingAnalysis {
		const unusedExports: Array<{ module: string; exports: string[] }> = [];
		const usedExports: Array<{ module: string; exports: string[] }> = [];

		for (const [module, exports] of this.availableExports) {
			const used: string[] = [];
			const unused: string[] = [];

			exports.forEach((exp) => {
				if (this.usedExports.has(`${module}:${exp}`)) {
					used.push(exp);
				} else {
					unused.push(exp);
				}
			});

			if (used.length > 0) {
				usedExports.push({ module, exports: used });
			}

			if (unused.length > 0) {
				unusedExports.push({ module, exports: unused });
			}
		}

		const totalExports = Array.from(this.availableExports.values()).flat().length;
		const usedCount = this.usedExports.size;
		const shakeablePercentage =
			totalExports > 0 ? ((totalExports - usedCount) / totalExports) * 100 : 0;

		return {
			unusedExports,
			usedExports,
			shakeablePercentage,
			recommendations: this.generateTreeShakingRecommendations(
				unusedExports,
				shakeablePercentage
			),
		};
	}

	// Generate recommendations
	private generateTreeShakingRecommendations(
		unusedExports: Array<{ module: string; exports: string[] }>,
		shakeablePercentage: number
	): string[] {
		const recommendations: string[] = [];

		if (shakeablePercentage > 50) {
			recommendations.push(
				`High tree shaking potential: ${shakeablePercentage.toFixed(1)}% of exports are unused`
			);
		}

		if (unusedExports.length > 0) {
			const modulesWithUnused = unusedExports
				.filter((item) => item.exports.length > 5)
				.map((item) => item.module);

			if (modulesWithUnused.length > 0) {
				recommendations.push(
					`Review modules with many unused exports: ${modulesWithUnused.join(", ")}`
				);
			}
		}

		return recommendations;
	}
}

export interface TreeShakingAnalysis {
	unusedExports: Array<{ module: string; exports: string[] }>;
	usedExports: Array<{ module: string; exports: string[] }>;
	shakeablePercentage: number;
	recommendations: string[];
}

// Bundle Optimization Factory
export const BundleOptimizationFactory = {
	createBundleAnalyzer(): BundleAnalyzer {
		return new BundleAnalyzer();
	},

	createCodeSplittingManager(): CodeSplittingManager {
		return new CodeSplittingManager();
	},

	createTreeShakingOptimizer(): TreeShakingOptimizer {
		return new TreeShakingOptimizer();
	},

	// Create webpack optimization config
	createWebpackOptimization(): unknown {
		return {
			splitChunks: {
				chunks: "all",
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: "vendors",
						chunks: "all",
						priority: 10,
					},
					common: {
						name: "common",
						minChunks: 2,
						priority: 5,
					},
				},
			},
			minimize: true,
			minimizer: [
				// TerserPlugin for JS minification
				// CssMinimizerPlugin for CSS minification
			],
		};
	},

	// Create rollup optimization config
	createRollupOptimization(): unknown {
		return {
			manualChunks: {
				vendor: ["react", "react-dom"],
				utils: ["lodash", "date-fns"],
			},
		};
	},

	// Create vite optimization config
	createViteOptimization(): unknown {
		return {
			build: {
				rollupOptions: {
					output: {
						manualChunks: {
							vendor: ["react", "react-dom"],
							utils: ["lodash", "date-fns"],
						},
					},
				},
				minify: "terser",
				terserOptions: {
					compress: {
						drop_console: true,
						drop_debugger: true,
					},
				},
			},
		};
	},
};
