export interface ServiceConfiguration {
	get(key: string): string | undefined;
	getNumber(key: string): number | undefined;
	getBoolean(key: string): boolean | undefined;
	getObject<T>(key: string): T | undefined;
	set(key: string, value: unknown): void;
	has(key: string): boolean;
	getAll(): Record<string, unknown>;
	loadFromEnvironment(): void;
	loadFromFile(path: string): Promise<void>;
	validate(): boolean;
	getValidationErrors(): string[];
}

export interface ConfigurationOptions {
	environment?: string;
	configFile?: string;
	requiredKeys?: string[];
	defaults?: Record<string, unknown>;
}
