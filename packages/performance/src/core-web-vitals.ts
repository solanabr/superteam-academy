// Core Web Vitals Metrics
export interface CoreWebVitalsMetrics {
	cls: number; // Cumulative Layout Shift
	fid: number; // First Input Delay
	lcp: number; // Largest Contentful Paint
	fcp: number; // First Contentful Paint
	ttfb: number; // Time to First Byte
	inp?: number; // Interaction to Next Paint (experimental)
}

// Web Vitals Thresholds
export const WEB_VITALS_THRESHOLDS = {
	cls: { good: 0.1, needsImprovement: 0.25 },
	fid: { good: 100, needsImprovement: 300 },
	lcp: { good: 2500, needsImprovement: 4000 },
	fcp: { good: 1800, needsImprovement: 3000 },
	ttfb: { good: 800, needsImprovement: 1800 },
	inp: { good: 200, needsImprovement: 500 },
} as const;

// Core Web Vitals Observer
export class CoreWebVitalsObserver {
	private observers: Map<string, PerformanceObserver> = new Map();
	private metrics: Partial<CoreWebVitalsMetrics> = {};
	private callbacks: Map<string, (metric: WebVitalsMetric) => void> = new Map();

	constructor() {
		this.initObservers();
	}

	// Initialize performance observers
	private initObservers(): void {
		// Largest Contentful Paint
		this.observeLCP();

		// First Input Delay
		this.observeFID();

		// Cumulative Layout Shift
		this.observeCLS();

		// First Contentful Paint
		this.observeFCP();

		// Time to First Byte
		this.observeTTFB();

		// Interaction to Next Paint (if supported)
		this.observeINP();
	}

	// Observe Largest Contentful Paint
	private observeLCP(): void {
		try {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1] as LargestContentfulPaint;

				this.metrics.lcp = lastEntry.startTime;
				this.notifyCallbacks("lcp", {
					name: "LCP",
					value: lastEntry.startTime,
					rating: this.getRating("lcp", lastEntry.startTime),
					timestamp: Date.now(),
					entry: lastEntry,
				});
			});

			observer.observe({ entryTypes: ["largest-contentful-paint"] });
			this.observers.set("lcp", observer);
		} catch (error) {
			console.warn("LCP observation not supported:", error);
		}
	}

	// Observe First Input Delay
	private observeFID(): void {
		try {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					const fidEntry = entry as PerformanceEntry & { processingStart?: number };
					if (fidEntry.processingStart) {
						const fid = fidEntry.processingStart - entry.startTime;
						this.metrics.fid = fid;
						this.notifyCallbacks("fid", {
							name: "FID",
							value: fid,
							rating: this.getRating("fid", fid),
							timestamp: Date.now(),
							entry,
						});
					}
				});
			});

			observer.observe({ entryTypes: ["first-input"] });
			this.observers.set("fid", observer);
		} catch (error) {
			console.warn("FID observation not supported:", error);
		}
	}

	// Observe Cumulative Layout Shift
	private observeCLS(): void {
		try {
			let clsValue = 0;
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value: number };
					if (!layoutShiftEntry.hadRecentInput) {
						clsValue += layoutShiftEntry.value;
					}
				});

				this.metrics.cls = clsValue;
				this.notifyCallbacks("cls", {
					name: "CLS",
					value: clsValue,
					rating: this.getRating("cls", clsValue),
					timestamp: Date.now(),
					entry: entries[entries.length - 1],
				});
			});

			observer.observe({ entryTypes: ["layout-shift"] });
			this.observers.set("cls", observer);
		} catch (error) {
			console.warn("CLS observation not supported:", error);
		}
	}

	// Observe First Contentful Paint
	private observeFCP(): void {
		try {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					this.metrics.fcp = entry.startTime;
					this.notifyCallbacks("fcp", {
						name: "FCP",
						value: entry.startTime,
						rating: this.getRating("fcp", entry.startTime),
						timestamp: Date.now(),
						entry,
					});
				});
			});

			observer.observe({ entryTypes: ["paint"] });
			this.observers.set("fcp", observer);
		} catch (error) {
			console.warn("FCP observation not supported:", error);
		}
	}

	// Observe Time to First Byte
	private observeTTFB(): void {
		try {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					const navigationEntry = entry as PerformanceNavigationTiming;
					const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
					this.metrics.ttfb = ttfb;
					this.notifyCallbacks("ttfb", {
						name: "TTFB",
						value: ttfb,
						rating: this.getRating("ttfb", ttfb),
						timestamp: Date.now(),
						entry,
					});
				});
			});

			observer.observe({ entryTypes: ["navigation"] });
			this.observers.set("ttfb", observer);
		} catch (error) {
			console.warn("TTFB observation not supported:", error);
		}
	}

	// Observe Interaction to Next Paint
	private observeINP(): void {
		try {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1] as PerformanceEntry & { processingEnd?: number };

				if (lastEntry.processingEnd) {
					const inp = lastEntry.processingEnd - lastEntry.startTime;
					this.metrics.inp = inp;
					this.notifyCallbacks("inp", {
						name: "INP",
						value: inp,
						rating: this.getRating("inp", inp),
						timestamp: Date.now(),
						entry: lastEntry as PerformanceEntry,
					});
				}
			});

			observer.observe({ entryTypes: ["event"] });
			this.observers.set("inp", observer);
		} catch (error) {
			console.warn("INP observation not supported:", error);
		}
	}

	// Register callback for metric updates
	onMetricUpdate(
		metric: keyof CoreWebVitalsMetrics,
		callback: (metric: WebVitalsMetric) => void
	): void {
		this.callbacks.set(metric, callback);
	}

	// Get current metrics
	getMetrics(): Partial<CoreWebVitalsMetrics> {
		return { ...this.metrics };
	}

	// Get metric rating
	private getRating(
		metric: keyof CoreWebVitalsMetrics,
		value: number
	): "good" | "needs-improvement" | "poor" {
		const thresholds = WEB_VITALS_THRESHOLDS[metric];
		if (!thresholds) return "good";

		if (value <= thresholds.good) return "good";
		if (value <= thresholds.needsImprovement) return "needs-improvement";
		return "poor";
	}

	// Notify callbacks
	private notifyCallbacks(metric: string, data: WebVitalsMetric): void {
		const callback = this.callbacks.get(metric);
		if (callback) {
			callback(data);
		}
	}

	// Cleanup observers
	destroy(): void {
		this.observers.forEach((observer) => {
			observer.disconnect();
		});
		this.observers.clear();
		this.callbacks.clear();
	}
}

export interface WebVitalsMetric {
	name: string;
	value: number;
	rating: "good" | "needs-improvement" | "poor";
	timestamp: number;
	entry?: PerformanceEntry;
}

// Performance Budget Manager
export class PerformanceBudgetManager {
	private budgets: PerformanceBudgets;
	private violations: PerformanceViolation[] = [];

	constructor(budgets: PerformanceBudgets) {
		this.budgets = budgets;
	}

	// Check if current metrics meet budgets
	checkBudgets(metrics: Partial<CoreWebVitalsMetrics>): BudgetCheckResult {
		const violations: PerformanceViolation[] = [];

		Object.entries(metrics).forEach(([metric, value]) => {
			const budget = this.budgets[metric as keyof CoreWebVitalsMetrics];
			if (budget && value > budget) {
				violations.push({
					metric: metric as keyof CoreWebVitalsMetrics,
					value,
					budget,
					severity: this.getSeverity(metric as keyof CoreWebVitalsMetrics, value, budget),
					timestamp: Date.now(),
				});
			}
		});

		this.violations.push(...violations);

		return {
			passed: violations.length === 0,
			violations,
			score: this.calculateScore(metrics),
		};
	}

	// Get performance score (0-100)
	private calculateScore(metrics: Partial<CoreWebVitalsMetrics>): number {
		const weights = {
			lcp: 0.25,
			fid: 0.2,
			cls: 0.15,
			fcp: 0.15,
			ttfb: 0.15,
			inp: 0.1,
		};

		let totalScore = 0;
		let totalWeight = 0;

		Object.entries(metrics).forEach(([metric, value]) => {
			const weight = weights[metric as keyof typeof weights];
			if (weight && value !== undefined) {
				const rating = this.getRating(metric as keyof CoreWebVitalsMetrics, value);
				const score = rating === "good" ? 100 : rating === "needs-improvement" ? 50 : 0;
				totalScore += score * weight;
				totalWeight += weight;
			}
		});

		return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
	}

	// Get severity of violation
	private getSeverity(
		_metric: keyof CoreWebVitalsMetrics,
		value: number,
		budget: number
	): "low" | "medium" | "high" {
		const ratio = value / budget;
		if (ratio < 1.2) return "low";
		if (ratio < 1.5) return "medium";
		return "high";
	}

	// Get rating for metric
	private getRating(
		metric: keyof CoreWebVitalsMetrics,
		value: number
	): "good" | "needs-improvement" | "poor" {
		const thresholds = WEB_VITALS_THRESHOLDS[metric];
		if (!thresholds) return "good";

		if (value <= thresholds.good) return "good";
		if (value <= thresholds.needsImprovement) return "needs-improvement";
		return "poor";
	}

	// Get budget violations
	getViolations(): PerformanceViolation[] {
		return [...this.violations];
	}

	// Clear violations
	clearViolations(): void {
		this.violations = [];
	}

	// Update budgets
	updateBudgets(budgets: Partial<PerformanceBudgets>): void {
		this.budgets = { ...this.budgets, ...budgets };
	}
}

export interface PerformanceBudgets {
	cls?: number;
	fid?: number;
	lcp?: number;
	fcp?: number;
	ttfb?: number;
	inp?: number;
}

export interface PerformanceViolation {
	metric: keyof CoreWebVitalsMetrics;
	value: number;
	budget: number;
	severity: "low" | "medium" | "high";
	timestamp: number;
}

export interface BudgetCheckResult {
	passed: boolean;
	violations: PerformanceViolation[];
	score: number;
}

// Resource Loading Optimizer
export class ResourceLoadingOptimizer {
	// Preload critical resources
	preload(
		resources: Array<{ href: string; as: string; type?: string; crossorigin?: boolean }>
	): void {
		if (typeof document === "undefined") return;

		resources.forEach((resource) => {
			const link = document.createElement("link");
			link.rel = "preload";
			link.href = resource.href;
			link.as = resource.as;
			if (resource.type) link.type = resource.type;
			if (resource.crossorigin) link.crossOrigin = "anonymous";

			document.head.appendChild(link);
		});
	}

	// Prefetch resources for future navigation
	prefetch(resources: string[]): void {
		if (typeof document === "undefined") return;

		resources.forEach((href) => {
			const link = document.createElement("link");
			link.rel = "prefetch";
			link.href = href;
			document.head.appendChild(link);
		});
	}

	// Preconnect to external domains
	preconnect(domains: string[]): void {
		if (typeof document === "undefined") return;

		domains.forEach((domain) => {
			const link = document.createElement("link");
			link.rel = "preconnect";
			link.href = domain;
			link.crossOrigin = "anonymous";
			document.head.appendChild(link);
		});
	}

	// DNS prefetch for external domains
	dnsPrefetch(domains: string[]): void {
		if (typeof document === "undefined") return;

		domains.forEach((domain) => {
			const link = document.createElement("link");
			link.rel = "dns-prefetch";
			link.href = domain;
			document.head.appendChild(link);
		});
	}

	// Optimize font loading
	optimizeFonts(
		fonts: Array<{
			href: string;
			type: string;
			display?: "auto" | "block" | "swap" | "fallback" | "optional";
		}>
	): void {
		if (typeof document === "undefined") return;

		fonts.forEach((font) => {
			const link = document.createElement("link");
			link.rel = "preload";
			link.href = font.href;
			link.as = "font";
			link.type = font.type;
			link.crossOrigin = "anonymous";

			// Add font-display
			if (font.display) {
				// Note: font-display is typically set in CSS, but we can add it as a style attribute
				link.setAttribute("style", `font-display: ${font.display};`);
			}

			document.head.appendChild(link);
		});
	}

	// Defer non-critical JavaScript
	deferNonCriticalJS(): void {
		if (typeof document === "undefined") return;

		// Find script tags without defer or async
		const scripts = document.querySelectorAll("script[src]:not([defer]):not([async])");
		scripts.forEach((script) => {
			const src = script.getAttribute("src");
			if (src && !this.isCriticalScript(src)) {
				script.setAttribute("defer", "");
			}
		});
	}

	// Check if script is critical
	private isCriticalScript(src: string): boolean {
		// Define critical scripts that should load immediately
		const criticalPatterns = [/analytics/i, /gtag/i, /googletagmanager/i, /critical/i];

		return criticalPatterns.some((pattern) => pattern.test(src));
	}

	// Optimize CSS delivery
	optimizeCSS(): void {
		if (typeof document === "undefined") return;

		// Inline critical CSS
		this.inlineCriticalCSS();

		// Load non-critical CSS asynchronously
		this.loadNonCriticalCSS();
	}

	// Inline critical CSS
	private inlineCriticalCSS(): void {
		// Find critical CSS link tags
		const criticalLinks = document.querySelectorAll('link[rel="stylesheet"][data-critical]');

		criticalLinks.forEach(async (link) => {
			const href = link.getAttribute("href");
			if (href) {
				try {
					const response = await fetch(href);
					const css = await response.text();

					const style = document.createElement("style");
					style.textContent = css;
					document.head.appendChild(style);

					// Remove the original link
					link.remove();
				} catch (error) {
					console.warn("Failed to inline critical CSS:", href, error);
				}
			}
		});
	}

	// Load non-critical CSS asynchronously
	private loadNonCriticalCSS(): void {
		const nonCriticalLinks = document.querySelectorAll(
			'link[rel="stylesheet"]:not([data-critical])'
		);

		nonCriticalLinks.forEach((el) => {
			const link = el as HTMLLinkElement;
			const href = link.getAttribute("href");
			if (href) {
				// Convert to async loading
				link.rel = "preload";
				link.as = "style";
				link.onload = () => {
					link.rel = "stylesheet";
				};
			}
		});
	}
}

// Performance Monitoring Dashboard
export class PerformanceMonitoringDashboard {
	private observer: CoreWebVitalsObserver;
	private budgetManager: PerformanceBudgetManager;
	private metrics: PerformanceMetricsData[] = [];
	private maxMetricsHistory = 100;

	constructor(budgets: PerformanceBudgets) {
		this.observer = new CoreWebVitalsObserver();
		this.budgetManager = new PerformanceBudgetManager(budgets);

		this.initMonitoring();
	}

	// Initialize monitoring
	private initMonitoring(): void {
		// Monitor all metrics
		(["cls", "fid", "lcp", "fcp", "ttfb", "inp"] as const).forEach((metric) => {
			this.observer.onMetricUpdate(metric, (data) => {
				this.recordMetric(data);
				this.checkBudgets();
			});
		});
	}

	// Record metric
	private recordMetric(metric: WebVitalsMetric): void {
		const data: PerformanceMetricsData = {
			...metric,
			timestamp: Date.now(),
			url: typeof window !== "undefined" ? window.location.href : "",
			userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
		};

		this.metrics.push(data);

		// Keep only recent metrics
		if (this.metrics.length > this.maxMetricsHistory) {
			this.metrics = this.metrics.slice(-this.maxMetricsHistory);
		}
	}

	// Check budgets and alert if needed
	private checkBudgets(): void {
		const currentMetrics = this.observer.getMetrics();
		const result = this.budgetManager.checkBudgets(currentMetrics);

		if (!result.passed) {
			this.alertViolations(result.violations);
		}
	}

	// Alert on budget violations
	private alertViolations(violations: PerformanceViolation[]): void {
		violations.forEach((violation) => {
			console.warn(`Performance Budget Violation: ${violation.metric.toUpperCase()}`, {
				value: violation.value,
				budget: violation.budget,
				severity: violation.severity,
			});

			// In a real app, this could send to monitoring service
			this.reportViolation(violation);
		});
	}

	// Report violation to external service
	private reportViolation(violation: PerformanceViolation): void {
		// This would integrate with error monitoring services
		if (typeof window !== "undefined" && "gtag" in window) {
			const win = window as unknown as { gtag: (...args: unknown[]) => void };
			win.gtag("event", "performance_violation", {
				metric: violation.metric,
				value: violation.value,
				budget: violation.budget,
				severity: violation.severity,
			});
		}
	}

	// Get dashboard data
	getDashboardData(): PerformanceDashboardData {
		const currentMetrics = this.observer.getMetrics();
		const budgetResult = this.budgetManager.checkBudgets(currentMetrics);

		return {
			currentMetrics,
			budgetResult,
			historicalData: this.metrics.slice(-20), // Last 20 measurements
			trends: this.calculateTrends(),
			recommendations: this.generateRecommendations(budgetResult.violations),
		};
	}

	// Calculate performance trends
	private calculateTrends(): PerformanceTrends {
		if (this.metrics.length < 2) {
			return { direction: "stable", change: 0 };
		}

		const recent = this.metrics.slice(-10);
		const older = this.metrics.slice(-20, -10);

		const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
		const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;

		const change = ((recentAvg - olderAvg) / olderAvg) * 100;

		return {
			direction: change > 5 ? "improving" : change < -5 ? "degrading" : "stable",
			change: Math.round(change * 100) / 100,
		};
	}

	// Generate optimization recommendations
	private generateRecommendations(violations: PerformanceViolation[]): string[] {
		const recommendations: string[] = [];

		violations.forEach((violation) => {
			switch (violation.metric) {
				case "lcp":
					recommendations.push(
						"Optimize Largest Contentful Paint by improving image loading, reducing server response time, and removing render-blocking resources"
					);
					break;
				case "fid":
					recommendations.push(
						"Reduce First Input Delay by minimizing JavaScript execution time and breaking up long tasks"
					);
					break;
				case "cls":
					recommendations.push(
						"Fix Cumulative Layout Shift by including size attributes on images and avoiding inserting content above existing content"
					);
					break;
				case "fcp":
					recommendations.push(
						"Improve First Contentful Paint by removing render-blocking resources and optimizing CSS delivery"
					);
					break;
				case "ttfb":
					recommendations.push(
						"Reduce Time to First Byte by optimizing server response time and using CDN"
					);
					break;
				default:
					break;
			}
		});

		return recommendations;
	}

	// Export metrics for analysis
	exportMetrics(): PerformanceMetricsData[] {
		return [...this.metrics];
	}

	// Clear metrics history
	clearHistory(): void {
		this.metrics = [];
		this.budgetManager.clearViolations();
	}
}

interface PerformanceMetricsData extends WebVitalsMetric {
	timestamp: number;
	url: string;
	userAgent: string;
}

export interface PerformanceDashboardData {
	currentMetrics: Partial<CoreWebVitalsMetrics>;
	budgetResult: BudgetCheckResult;
	historicalData: PerformanceMetricsData[];
	trends: PerformanceTrends;
	recommendations: string[];
}

export interface PerformanceTrends {
	direction: "improving" | "degrading" | "stable";
	change: number;
}

// Core Web Vitals Factory
export const CoreWebVitalsFactory = {
	createObserver(): CoreWebVitalsObserver {
		return new CoreWebVitalsObserver();
	},

	createBudgetManager(budgets: PerformanceBudgets): PerformanceBudgetManager {
		return new PerformanceBudgetManager(budgets);
	},

	createResourceOptimizer(): ResourceLoadingOptimizer {
		return new ResourceLoadingOptimizer();
	},

	createMonitoringDashboard(budgets: PerformanceBudgets): PerformanceMonitoringDashboard {
		return new PerformanceMonitoringDashboard(budgets);
	},

	getDefaultBudgets(): PerformanceBudgets {
		return {
			cls: 0.1,
			fid: 100,
			lcp: 2500,
			fcp: 1800,
			ttfb: 800,
			inp: 200,
		};
	},
};
