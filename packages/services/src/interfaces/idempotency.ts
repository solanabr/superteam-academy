export interface IdempotencyKey {
	key: string;
	operation: string;
	userId?: string;
	expiresAt: Date;
}

export interface IdempotencyRecord {
	key: string;
	operation: string;
	status: "pending" | "completed" | "failed";
	result?: unknown;
	error?: string;
	createdAt: Date;
	completedAt?: Date;
	expiresAt: Date;
}

export interface IdempotencyConfig {
	ttl: number; // time to live in milliseconds
	keyPrefix: string;
	cleanupInterval: number; // cleanup interval in milliseconds
}

export interface IdempotencyHandler {
	generateKey(operation: string, params: Record<string, unknown>): string;
	checkKey(key: string): Promise<IdempotencyRecord | null>;
	storeKey(key: string, operation: string, ttl?: number): Promise<void>;
	markCompleted(key: string, result: unknown): Promise<void>;
	markFailed(key: string, error: string): Promise<void>;
	cleanup(): Promise<number>; // returns number of cleaned records
}

export interface IdempotentOperation<TInput, TOutput> {
	execute(input: TInput): Promise<TOutput>;
	getKey(input: TInput): string;
	shouldRetryOnFailure(error: Error): boolean;
}

export interface IdempotentService {
	execute<TInput, TOutput>(
		operation: IdempotentOperation<TInput, TOutput>,
		input: TInput
	): Promise<TOutput>;
}
