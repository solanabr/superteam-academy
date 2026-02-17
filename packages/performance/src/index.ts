// Performance Optimization Package Exports
export * from "./code-splitting";
export * from "./caching-strategies";
export * from "./image-optimization";
export * from "./performance-monitoring";

// Re-export from bundle-optimization (BundleAnalyzer renamed to avoid conflict with code-splitting)
export type {
	BundleAnalysis,
	BundleChunk,
	BundleModule,
	BundleAsset,
	DependencyInfo,
	CodeSplittingStatus,
	TreeShakingAnalysis,
} from "./bundle-optimization";
export {
	BundleAnalyzer as BundleStatsAnalyzer,
	CodeSplittingManager,
	TreeShakingOptimizer,
	BundleOptimizationFactory,
} from "./bundle-optimization";

// Re-export from core-web-vitals (BudgetCheckResult, PerformanceTrends renamed to avoid conflicts)
export type {
	CoreWebVitalsMetrics,
	WebVitalsMetric,
	PerformanceBudgets,
	PerformanceViolation,
	BudgetCheckResult as WebVitalsBudgetCheckResult,
	PerformanceDashboardData,
	PerformanceTrends as WebVitalsPerformanceTrends,
} from "./core-web-vitals";
export {
	WEB_VITALS_THRESHOLDS,
	CoreWebVitalsObserver,
	PerformanceBudgetManager,
	ResourceLoadingOptimizer,
	PerformanceMonitoringDashboard,
	CoreWebVitalsFactory,
} from "./core-web-vitals";

// Factory exports for easy instantiation
export { CodeSplittingFactory } from "./code-splitting";
export { CachingFactory } from "./caching-strategies";
export { ImageOptimizationFactory } from "./image-optimization";
export { PerformanceMonitoringFactory } from "./performance-monitoring";
