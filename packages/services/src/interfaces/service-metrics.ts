export interface ServiceMetric {
	service: string;
	metric: string;
	value: number;
	timestamp: Date;
	tags?: Record<string, string>;
}

export interface ServiceMetrics {
	recordMetric(
		service: string,
		metric: string,
		value: number,
		tags?: Record<string, string>
	): void;
	incrementCounter(service: string, metric: string, tags?: Record<string, string>): void;
	recordTiming(
		service: string,
		metric: string,
		duration: number,
		tags?: Record<string, string>
	): void;
	recordError(service: string, error: Error, tags?: Record<string, string>): void;
	getMetrics(service?: string, metric?: string): Promise<ServiceMetric[]>;
	getAggregatedMetrics(
		service: string,
		metric: string,
		timeframe: number
	): Promise<{
		count: number;
		sum: number;
		avg: number;
		min: number;
		max: number;
	}>;
}
