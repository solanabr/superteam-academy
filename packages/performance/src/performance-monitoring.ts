// Performance Metrics Types
export interface PerformanceMetrics {
	navigation: NavigationMetrics;
	paint: PaintMetrics;
	resource: ResourceMetrics[];
	javascript: JavaScriptMetrics;
	memory?: MemoryMetrics;
	network: NetworkMetrics;
	timestamp: number;
	url: string;
}

export interface NavigationMetrics {
	domContentLoaded: number;
	loadComplete: number;
	domInteractive: number;
	firstPaint?: number;
	firstContentfulPaint?: number;
	largestContentfulPaint?: number;
}

export interface PaintMetrics {
	firstPaint: number;
	firstContentfulPaint: number;
	largestContentfulPaint: number;
}

export interface ResourceMetrics {
	name: string;
	type: "script" | "link" | "img" | "css" | "font" | "other";
	size: number;
	loadTime: number;
	cached: boolean;
	initiator: string;
}

export interface JavaScriptMetrics {
	heapUsed: number;
	heapTotal: number;
	heapLimit: number;
	executionTime: number;
	longTasks: LongTask[];
}

export interface LongTask {
	startTime: number;
	duration: number;
	name: string;
	entryType: string;
}

export interface MemoryMetrics {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

export interface NetworkMetrics {
	effectiveType: string;
	downlink: number;
	rtt: number;
	saveData: boolean;
}

// Performance Monitor
export class PerformanceMonitor {
	private observers: Map<string, PerformanceObserver> = new Map();
	private metrics: PerformanceMetrics[] = [];
	private maxHistorySize = 100;
	private isMonitoring = false;

	constructor() {
		this.initObservers();
	}

	// Start monitoring
	startMonitoring(): void {
		if (this.isMonitoring) return;
		this.isMonitoring = true;

		// Start collecting metrics
		this.collectNavigationMetrics();
		this.collectResourceMetrics();
		this.collectJavaScriptMetrics();
		this.collectNetworkMetrics();

		// Set up periodic collection
		setInterval(() => {
			this.collectPeriodicMetrics();
		}, 30_000); // Every 30 seconds
	}

	// Stop monitoring
	stopMonitoring(): void {
		this.isMonitoring = false;
		this.observers.forEach((observer) => {
			observer.disconnect();
		});
		this.observers.clear();
	}

	// Initialize performance observers
	private initObservers(): void {
		// Long Tasks Observer
		this.observeLongTasks();

		// Resource Timing Observer
		this.observeResourceTiming();

		// Navigation Timing Observer
		this.observeNavigationTiming();

		// Paint Timing Observer
		this.observePaintTiming();
	}

	// Observe long tasks
	private observeLongTasks(): void {
		try {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					const longTask: LongTask = {
						startTime: entry.startTime,
						duration: entry.duration,
						name: entry.name || "unknown",
						entryType: entry.entryType,
					};

					// Update current metrics
					this.updateJavaScriptMetrics({ longTasks: [longTask] });
				});
			});

			observer.observe({ entryTypes: ["longtask"] });
			this.observers.set("longtask", observer);
		} catch (error) {
			console.warn("Long task observation not supported:", error);
		}
	}

	// Observe resource timing
	private observeResourceTiming(): void {
		try {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const resources: ResourceMetrics[] = entries.map((entry) => {
					const resourceEntry = entry as PerformanceResourceTiming;
					return {
						name: resourceEntry.name,
						type: this.getResourceType(resourceEntry.initiatorType),
						size: resourceEntry.transferSize || 0,
						loadTime: resourceEntry.responseEnd - resourceEntry.requestStart,
						cached: resourceEntry.transferSize === 0,
						initiator: resourceEntry.initiatorType,
					};
				});

				this.updateResourceMetrics(resources);
			});

			observer.observe({ entryTypes: ["resource"] });
			this.observers.set("resource", observer);
		} catch (error) {
			console.warn("Resource timing observation not supported:", error);
		}
	}

	// Observe navigation timing
	private observeNavigationTiming(): void {
		try {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					const navEntry = entry as PerformanceNavigationTiming;
					const navigation: NavigationMetrics = {
						domContentLoaded:
							navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
						loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
						domInteractive: navEntry.domInteractive - navEntry.startTime,
						firstPaint: this.getFirstPaint(),
						firstContentfulPaint: this.getFirstContentfulPaint(),
						largestContentfulPaint: this.getLargestContentfulPaint(),
					};

					this.updateNavigationMetrics(navigation);
				});
			});

			observer.observe({ entryTypes: ["navigation"] });
			this.observers.set("navigation", observer);
		} catch (error) {
			console.warn("Navigation timing observation not supported:", error);
		}
	}

	// Observe paint timing
	private observePaintTiming(): void {
		try {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					if (entry.name === "first-paint") {
						this.updatePaintMetrics({ firstPaint: entry.startTime });
					} else if (entry.name === "first-contentful-paint") {
						this.updatePaintMetrics({ firstContentfulPaint: entry.startTime });
					}
				});
			});

			observer.observe({ entryTypes: ["paint"] });
			this.observers.set("paint", observer);
		} catch (error) {
			console.warn("Paint timing observation not supported:", error);
		}
	}

	// Collect navigation metrics
	private collectNavigationMetrics(): void {
		if (typeof performance === "undefined" || !performance.timing) return;

		const timing = performance.timing;
		const navigation: NavigationMetrics = {
			domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
			loadComplete: timing.loadEventEnd - timing.loadEventStart,
			domInteractive: timing.domInteractive - timing.navigationStart,
			firstPaint: this.getFirstPaint(),
			firstContentfulPaint: this.getFirstContentfulPaint(),
			largestContentfulPaint: this.getLargestContentfulPaint(),
		};

		this.updateNavigationMetrics(navigation);
	}

	// Collect resource metrics
	private collectResourceMetrics(): void {
		if (typeof performance === "undefined" || !performance.getEntriesByType) return;

		const entries = performance.getEntriesByType("resource");
		const resources: ResourceMetrics[] = entries.map((entry) => {
			const resourceEntry = entry as PerformanceResourceTiming;
			return {
				name: resourceEntry.name,
				type: this.getResourceType(resourceEntry.initiatorType),
				size: resourceEntry.transferSize || 0,
				loadTime: resourceEntry.responseEnd - resourceEntry.requestStart,
				cached: resourceEntry.transferSize === 0,
				initiator: resourceEntry.initiatorType,
			};
		});

		this.updateResourceMetrics(resources);
	}

	// Collect JavaScript metrics
	private collectJavaScriptMetrics(): void {
		if (typeof performance === "undefined") return;
		const perfWithMemory = performance as Performance & {
			memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
		};
		if (!perfWithMemory.memory) return;

		const memory = perfWithMemory.memory;
		const jsMetrics: JavaScriptMetrics = {
			heapUsed: memory.usedJSHeapSize,
			heapTotal: memory.totalJSHeapSize,
			heapLimit: memory.jsHeapSizeLimit,
			executionTime: this.getExecutionTime(),
			longTasks: this.getLongTasks(),
		};

		this.updateJavaScriptMetrics(jsMetrics);
	}

	// Collect network metrics
	private collectNetworkMetrics(): void {
		if (typeof navigator === "undefined" || !("connection" in navigator)) return;

		const navWithConnection = navigator as Navigator & {
			connection?: {
				effectiveType?: string;
				downlink?: number;
				rtt?: number;
				saveData?: boolean;
			};
		};
		const connection = navWithConnection.connection;
		if (!connection) return;

		const network: NetworkMetrics = {
			effectiveType: connection.effectiveType || "unknown",
			downlink: connection.downlink || 0,
			rtt: connection.rtt || 0,
			saveData: connection.saveData || false,
		};

		this.updateNetworkMetrics(network);
	}

	// Collect periodic metrics
	private collectPeriodicMetrics(): void {
		if (!this.isMonitoring) return;

		this.collectJavaScriptMetrics();
		this.collectNetworkMetrics();
	}

	// Update navigation metrics
	private updateNavigationMetrics(navigation: Partial<NavigationMetrics>): void {
		this.updateCurrentMetrics({ navigation: navigation as NavigationMetrics });
	}

	// Update paint metrics
	private updatePaintMetrics(paint: Partial<PaintMetrics>): void {
		this.updateCurrentMetrics({ paint: paint as PaintMetrics });
	}

	// Update resource metrics
	private updateResourceMetrics(resources: ResourceMetrics[]): void {
		this.updateCurrentMetrics({ resource: resources });
	}

	// Update JavaScript metrics
	private updateJavaScriptMetrics(js: Partial<JavaScriptMetrics>): void {
		this.updateCurrentMetrics({ javascript: js as JavaScriptMetrics });
	}

	// Update network metrics
	private updateNetworkMetrics(network: Partial<NetworkMetrics>): void {
		this.updateCurrentMetrics({ network: network as NetworkMetrics });
	}

	// Update current metrics
	private updateCurrentMetrics(updates: Partial<PerformanceMetrics>): void {
		const current = this.getCurrentMetrics();
		const updated = {
			...current,
			...updates,
			timestamp: Date.now(),
			url: typeof window !== "undefined" ? window.location.href : "",
		};

		this.metrics.push(updated as PerformanceMetrics);

		// Keep history size manageable
		if (this.metrics.length > this.maxHistorySize) {
			this.metrics = this.metrics.slice(-this.maxHistorySize);
		}
	}

	// Get current metrics
	private getCurrentMetrics(): Partial<PerformanceMetrics> {
		return (
			this.metrics[this.metrics.length - 1] || {
				navigation: {} as NavigationMetrics,
				paint: {} as PaintMetrics,
				resource: [],
				javascript: {} as JavaScriptMetrics,
				network: {} as NetworkMetrics,
			}
		);
	}

	// Helper methods
	private getResourceType(initiatorType: string): ResourceMetrics["type"] {
		switch (initiatorType) {
			case "script":
				return "script";
			case "link":
				return "link";
			case "img":
				return "img";
			case "css":
				return "css";
			case "font":
				return "font";
			default:
				return "other";
		}
	}

	private getFirstPaint(): number {
		if (typeof performance === "undefined" || !performance.getEntriesByType) return 0;
		const entries = performance.getEntriesByType("paint");
		const fp = entries.find((entry) => entry.name === "first-paint");
		return fp ? fp.startTime : 0;
	}

	private getFirstContentfulPaint(): number {
		if (typeof performance === "undefined" || !performance.getEntriesByType) return 0;
		const entries = performance.getEntriesByType("paint");
		const fcp = entries.find((entry) => entry.name === "first-contentful-paint");
		return fcp ? fcp.startTime : 0;
	}

	private getLargestContentfulPaint(): number {
		if (typeof performance === "undefined" || !performance.getEntriesByType) return 0;
		const entries = performance.getEntriesByType("largest-contentful-paint");
		const lcp = entries[entries.length - 1];
		return lcp ? lcp.startTime : 0;
	}

	private getExecutionTime(): number {
		if (typeof performance === "undefined" || !performance.getEntriesByType) return 0;
		const entries = performance.getEntriesByType("measure");
		return entries.reduce((total, entry) => total + entry.duration, 0);
	}

	private getLongTasks(): LongTask[] {
		if (typeof performance === "undefined" || !performance.getEntriesByType) return [];
		const entries = performance.getEntriesByType("longtask");
		return entries.map((entry) => ({
			startTime: entry.startTime,
			duration: entry.duration,
			name: entry.name || "unknown",
			entryType: entry.entryType,
		}));
	}

	// Get performance report
	getPerformanceReport(): PerformanceReport {
		const current = this.getCurrentMetrics() as PerformanceMetrics;
		const history = this.metrics.slice(-10); // Last 10 measurements

		return {
			current,
			history,
			averages: this.calculateAverages(history),
			trends: this.calculateTrends(history),
			alerts: this.generateAlerts(current),
		};
	}

	// Calculate averages
	private calculateAverages(history: PerformanceMetrics[]): PerformanceAverages {
		if (history.length === 0) return {} as PerformanceAverages;

		const sum = history.reduce(
			(acc, metric) => ({
				navigation: {
					domContentLoaded:
						acc.navigation.domContentLoaded +
						(metric.navigation?.domContentLoaded || 0),
					loadComplete:
						acc.navigation.loadComplete + (metric.navigation?.loadComplete || 0),
					domInteractive:
						acc.navigation.domInteractive + (metric.navigation?.domInteractive || 0),
					firstPaint: acc.navigation.firstPaint + (metric.navigation?.firstPaint || 0),
					firstContentfulPaint:
						acc.navigation.firstContentfulPaint +
						(metric.navigation?.firstContentfulPaint || 0),
					largestContentfulPaint:
						acc.navigation.largestContentfulPaint +
						(metric.navigation?.largestContentfulPaint || 0),
				},
				paint: {
					firstPaint: acc.paint.firstPaint + (metric.paint?.firstPaint || 0),
					firstContentfulPaint:
						acc.paint.firstContentfulPaint + (metric.paint?.firstContentfulPaint || 0),
					largestContentfulPaint:
						acc.paint.largestContentfulPaint +
						(metric.paint?.largestContentfulPaint || 0),
				},
				javascript: {
					heapUsed: acc.javascript.heapUsed + (metric.javascript?.heapUsed || 0),
					executionTime:
						acc.javascript.executionTime + (metric.javascript?.executionTime || 0),
				},
			}),
			{
				navigation: {
					domContentLoaded: 0,
					loadComplete: 0,
					domInteractive: 0,
					firstPaint: 0,
					firstContentfulPaint: 0,
					largestContentfulPaint: 0,
				},
				paint: { firstPaint: 0, firstContentfulPaint: 0, largestContentfulPaint: 0 },
				javascript: { heapUsed: 0, executionTime: 0 },
			}
		);

		const count = history.length;
		return {
			navigation: {
				domContentLoaded: sum.navigation.domContentLoaded / count,
				loadComplete: sum.navigation.loadComplete / count,
				domInteractive: sum.navigation.domInteractive / count,
				firstPaint: sum.navigation.firstPaint / count,
				firstContentfulPaint: sum.navigation.firstContentfulPaint / count,
				largestContentfulPaint: sum.navigation.largestContentfulPaint / count,
			},
			paint: {
				firstPaint: sum.paint.firstPaint / count,
				firstContentfulPaint: sum.paint.firstContentfulPaint / count,
				largestContentfulPaint: sum.paint.largestContentfulPaint / count,
			},
			javascript: {
				heapUsed: sum.javascript.heapUsed / count,
				executionTime: sum.javascript.executionTime / count,
			},
		};
	}

	// Calculate trends
	private calculateTrends(history: PerformanceMetrics[]): PerformanceTrends {
		if (history.length < 2) return { direction: "stable", change: 0 };

		const recent = history.slice(-5);
		const older = history.slice(-10, -5);

		const recentAvg =
			recent.reduce((sum, m) => sum + (m.javascript?.executionTime || 0), 0) / recent.length;
		const olderAvg =
			older.reduce((sum, m) => sum + (m.javascript?.executionTime || 0), 0) / older.length;

		const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

		return {
			direction: change > 10 ? "degrading" : change < -10 ? "improving" : "stable",
			change: Math.round(change * 100) / 100,
		};
	}

	// Generate alerts
	private generateAlerts(current: PerformanceMetrics): PerformanceAlert[] {
		const alerts: PerformanceAlert[] = [];

		// Check for performance issues
		if (current.javascript?.heapUsed && current.javascript.heapTotal) {
			const heapUsage = (current.javascript.heapUsed / current.javascript.heapTotal) * 100;
			if (heapUsage > 90) {
				alerts.push({
					type: "warning",
					message: `High memory usage: ${heapUsage.toFixed(1)}%`,
					metric: "memory",
					value: heapUsage,
				});
			}
		}

		if (current.javascript?.longTasks && current.javascript.longTasks.length > 0) {
			alerts.push({
				type: "warning",
				message: `${current.javascript.longTasks.length} long tasks detected`,
				metric: "longTasks",
				value: current.javascript.longTasks.length,
			});
		}

		if (
			current.navigation?.largestContentfulPaint &&
			current.navigation.largestContentfulPaint > 4000
		) {
			alerts.push({
				type: "error",
				message: `Poor LCP: ${current.navigation.largestContentfulPaint}ms`,
				metric: "lcp",
				value: current.navigation.largestContentfulPaint,
			});
		}

		return alerts;
	}

	// Export metrics
	exportMetrics(): PerformanceMetrics[] {
		return [...this.metrics];
	}

	// Clear metrics
	clearMetrics(): void {
		this.metrics = [];
	}
}

export interface PerformanceReport {
	current: PerformanceMetrics;
	history: PerformanceMetrics[];
	averages: PerformanceAverages;
	trends: PerformanceTrends;
	alerts: PerformanceAlert[];
}

export interface PerformanceAverages {
	navigation: NavigationMetrics;
	paint: PaintMetrics;
	javascript: {
		heapUsed: number;
		executionTime: number;
	};
}

export interface PerformanceTrends {
	direction: "improving" | "degrading" | "stable";
	change: number;
}

export interface PerformanceAlert {
	type: "info" | "warning" | "error";
	message: string;
	metric: string;
	value: number;
}

// Performance Monitoring Factory
export const PerformanceMonitoringFactory = {
	createMonitor(): PerformanceMonitor {
		return new PerformanceMonitor();
	},

	// Create performance budget
	createPerformanceBudget(budgets: {
		lcp?: number;
		fid?: number;
		cls?: number;
		fcp?: number;
		ttfb?: number;
		bundleSize?: number;
	}): PerformanceBudget {
		return new PerformanceBudget(budgets);
	},

	// Create performance reporter
	createReporter(config: {
		endpoint?: string;
		apiKey?: string;
		batchSize?: number;
		flushInterval?: number;
	}): PerformanceReporter {
		return new PerformanceReporter(config);
	},
};

// Performance Budget
export class PerformanceBudget {
	private budgets: Map<string, number> = new Map();
	private violations: BudgetViolation[] = [];

	constructor(budgets: Record<string, number>) {
		Object.entries(budgets).forEach(([metric, value]) => {
			this.budgets.set(metric, value);
		});
	}

	// Check if metrics meet budget
	checkBudget(metrics: Partial<PerformanceMetrics>): BudgetCheckResult {
		const violations: BudgetViolation[] = [];

		this.budgets.forEach((budget, metric) => {
			let value: number | undefined;

			switch (metric) {
				case "lcp":
					value = metrics.navigation?.largestContentfulPaint;
					break;
				case "fid":
					// FID would need to be tracked separately
					break;
				case "cls":
					// CLS would need to be tracked separately
					break;
				case "fcp":
					value = metrics.navigation?.firstContentfulPaint;
					break;
				case "ttfb":
					// TTFB from navigation timing
					break;
				case "bundleSize":
					value = metrics.resource?.reduce((sum, r) => sum + r.size, 0);
					break;
				default:
					break;
			}

			if (value && value > budget) {
				violations.push({
					metric,
					value,
					budget,
					severity: this.getSeverity(value, budget),
					timestamp: Date.now(),
				});
			}
		});

		this.violations.push(...violations);

		return {
			passed: violations.length === 0,
			violations,
			score: this.calculateBudgetScore(metrics),
		};
	}

	private getSeverity(value: number, budget: number): "low" | "medium" | "high" {
		const ratio = value / budget;
		if (ratio < 1.1) return "low";
		if (ratio < 1.25) return "medium";
		return "high";
	}

	private calculateBudgetScore(_metrics: Partial<PerformanceMetrics>): number {
		// Simple scoring based on budget compliance
		const totalBudgets = this.budgets.size;
		const violations = this.violations.length;
		return Math.max(0, Math.round(((totalBudgets - violations) / totalBudgets) * 100));
	}

	getViolations(): BudgetViolation[] {
		return [...this.violations];
	}
}

export interface BudgetViolation {
	metric: string;
	value: number;
	budget: number;
	severity: "low" | "medium" | "high";
	timestamp: number;
}

export interface BudgetCheckResult {
	passed: boolean;
	violations: BudgetViolation[];
	score: number;
}

// Performance Reporter
export class PerformanceReporter {
	private endpoint: string | undefined;
	private apiKey: string | undefined;
	private batchSize: number;
	private flushInterval: number;
	private queue: PerformanceMetrics[] = [];
	private flushTimer: ReturnType<typeof setInterval> | undefined;

	constructor(config: {
		endpoint?: string;
		apiKey?: string;
		batchSize?: number;
		flushInterval?: number;
	}) {
		this.endpoint = config.endpoint;
		this.apiKey = config.apiKey;
		this.batchSize = config.batchSize || 10;
		this.flushInterval = config.flushInterval || 30_000; // 30 seconds

		this.startFlushTimer();
	}

	// Report metrics
	report(metrics: PerformanceMetrics): void {
		this.queue.push(metrics);

		if (this.queue.length >= this.batchSize) {
			this.flush();
		}
	}

	// Flush queued metrics
	private async flush(): Promise<void> {
		if (this.queue.length === 0 || !this.endpoint) return;

		const batch = this.queue.splice(0);

		try {
			const response = await fetch(this.endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
				},
				body: JSON.stringify({ metrics: batch }),
			});

			if (!response.ok) {
				console.warn("Failed to report performance metrics:", response.statusText);
				// Re-queue failed metrics
				this.queue.unshift(...batch);
			}
		} catch (error) {
			console.warn("Error reporting performance metrics:", error);
			// Re-queue failed metrics
			this.queue.unshift(...batch);
		}
	}

	// Start flush timer
	private startFlushTimer(): void {
		this.flushTimer = setInterval(() => {
			this.flush();
		}, this.flushInterval);
	}

	// Stop reporting
	stop(): void {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = undefined;
		}
		this.flush(); // Final flush
	}
}
