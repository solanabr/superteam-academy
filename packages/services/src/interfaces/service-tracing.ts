export interface TraceSpan {
	id: string;
	parentId?: string;
	name: string;
	service: string;
	startTime: Date;
	endTime?: Date;
	duration?: number;
	tags?: Record<string, string>;
	logs: TraceLog[];
	error?: Error;
}

export interface TraceLog {
	timestamp: Date;
	message: string;
	data?: Record<string, unknown>;
}

export interface ServiceTracer {
	startSpan(name: string, service: string, parentId?: string): string;
	endSpan(spanId: string): void;
	log(spanId: string, message: string, data?: Record<string, unknown>): void;
	setTag(spanId: string, key: string, value: string): void;
	recordError(spanId: string, error: Error): void;
	getSpan(spanId: string): TraceSpan | null;
	getAllSpans(): TraceSpan[];
	getServiceSpans(service: string): TraceSpan[];
}
