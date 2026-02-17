export interface ServiceError {
	code: string;
	message: string;
	details?: unknown;
	timestamp: Date;
	requestId?: string;
}

export interface RetryConfig {
	maxAttempts: number;
	baseDelay: number; // in milliseconds
	maxDelay: number; // in milliseconds
	backoffFactor: number;
	retryableErrors: string[];
}

export interface RetryStrategy {
	shouldRetry(error: ServiceError, attempt: number): boolean;
	getDelay(attempt: number): number;
	executeWithRetry<T>(operation: () => Promise<T>, config: RetryConfig): Promise<T>;
}

export interface CircuitBreakerConfig {
	failureThreshold: number;
	recoveryTimeout: number; // in milliseconds
	monitoringPeriod: number; // in milliseconds
}

export interface CircuitBreakerState {
	state: "closed" | "open" | "half-open";
	failures: number;
	lastFailureTime?: Date;
	nextAttemptTime?: Date;
}

export interface CircuitBreaker {
	execute<T>(operation: () => Promise<T>): Promise<T>;
	getState(): CircuitBreakerState;
	reset(): void;
}

export interface BulkheadConfig {
	maxConcurrentCalls: number;
	maxQueueSize: number;
	queueTimeout: number; // in milliseconds
}

export interface Bulkhead {
	execute<T>(operation: () => Promise<T>): Promise<T>;
	getStats(): { active: number; queued: number; completed: number; failed: number };
}
