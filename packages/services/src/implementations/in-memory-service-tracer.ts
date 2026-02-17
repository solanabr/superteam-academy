import type { ServiceTracer, TraceSpan } from "../interfaces/service-tracing";

export class InMemoryServiceTracer implements ServiceTracer {
	private spans: Map<string, TraceSpan> = new Map();
	private maxSpans = 10_000; // Prevent memory leaks

	startSpan(name: string, service: string, parentId?: string): string {
		const spanId = this.generateSpanId();
		const span: TraceSpan = {
			id: spanId,
			...(parentId !== undefined && { parentId }),
			name,
			service,
			startTime: new Date(),
			logs: [],
			tags: {},
		};

		this.spans.set(spanId, span);

		// Clean up old spans if we exceed the limit
		if (this.spans.size > this.maxSpans) {
			this.cleanupOldSpans();
		}

		return spanId;
	}

	endSpan(spanId: string): void {
		const span = this.spans.get(spanId);
		if (span) {
			span.endTime = new Date();
			span.duration = span.endTime.getTime() - span.startTime.getTime();
		}
	}

	log(spanId: string, message: string, data?: Record<string, unknown>): void {
		const span = this.spans.get(spanId);
		if (span) {
			span.logs.push({
				timestamp: new Date(),
				message,
				data: data || {},
			});
		}
	}

	setTag(spanId: string, key: string, value: string): void {
		const span = this.spans.get(spanId);
		if (span) {
			span.tags = span.tags || {};
			span.tags[key] = value;
		}
	}

	recordError(spanId: string, error: Error): void {
		const span = this.spans.get(spanId);
		if (span) {
			span.error = error;
			this.log(spanId, `Error: ${error.message}`, { stack: error.stack });
		}
	}

	getSpan(spanId: string): TraceSpan | null {
		return this.spans.get(spanId) || null;
	}

	getAllSpans(): TraceSpan[] {
		return Array.from(this.spans.values());
	}

	getServiceSpans(service: string): TraceSpan[] {
		return Array.from(this.spans.values()).filter((span) => span.service === service);
	}

	private generateSpanId(): string {
		return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private cleanupOldSpans(): void {
		// Remove the oldest 10% of spans
		const spansToRemove = Math.floor(this.maxSpans * 0.1);
		const sortedSpans = Array.from(this.spans.entries()).sort(
			([, a], [, b]) => a.startTime.getTime() - b.startTime.getTime()
		);

		for (let i = 0; i < spansToRemove && i < sortedSpans.length; i++) {
			this.spans.delete(sortedSpans[i][0]);
		}
	}
}
