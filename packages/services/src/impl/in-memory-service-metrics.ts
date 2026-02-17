import type { ServiceMetrics, ServiceMetric } from "../interfaces/service-metrics";

export class InMemoryServiceMetrics implements ServiceMetrics {
	private metrics: ServiceMetric[] = [];
	private maxMetrics = 10_000; // Keep last 10k metrics

	recordMetric(
		service: string,
		metric: string,
		value: number,
		tags?: Record<string, string>
	): void {
		const metricData: ServiceMetric = {
			service,
			metric,
			value,
			timestamp: new Date(),
			...(tags !== undefined && { tags }),
		};

		this.metrics.push(metricData);

		// Keep only recent metrics
		if (this.metrics.length > this.maxMetrics) {
			this.metrics = this.metrics.slice(-this.maxMetrics);
		}
	}

	incrementCounter(service: string, metric: string, tags?: Record<string, string>): void {
		this.recordMetric(service, metric, 1, tags);
	}

	recordTiming(
		service: string,
		metric: string,
		duration: number,
		tags?: Record<string, string>
	): void {
		this.recordMetric(service, `${metric}_duration`, duration, tags);
	}

	recordError(service: string, error: Error, tags?: Record<string, string>): void {
		this.incrementCounter(service, "errors_total", {
			error_type: error.name,
			error_message: error.message.substring(0, 100), // Truncate long messages
			...tags,
		});
	}

	async getMetrics(service?: string, metric?: string): Promise<ServiceMetric[]> {
		let filtered = this.metrics;

		if (service) {
			filtered = filtered.filter((m) => m.service === service);
		}

		if (metric) {
			filtered = filtered.filter((m) => m.metric === metric);
		}

		return filtered;
	}

	async getAggregatedMetrics(
		service: string,
		metric: string,
		timeframe: number
	): Promise<{
		count: number;
		sum: number;
		avg: number;
		min: number;
		max: number;
	}> {
		const cutoff = new Date(Date.now() - timeframe);
		const relevantMetrics = this.metrics.filter(
			(m) => m.service === service && m.metric === metric && m.timestamp >= cutoff
		);

		if (relevantMetrics.length === 0) {
			return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
		}

		const values = relevantMetrics.map((m) => m.value);
		const sum = values.reduce((a, b) => a + b, 0);

		return {
			count: relevantMetrics.length,
			sum,
			avg: sum / relevantMetrics.length,
			min: Math.min(...values),
			max: Math.max(...values),
		};
	}
}
