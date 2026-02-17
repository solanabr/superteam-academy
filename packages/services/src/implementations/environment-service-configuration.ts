import type {
    ServiceConfiguration,
    ConfigurationOptions,
} from "../interfaces/service-configuration";

export class EnvironmentServiceConfiguration implements ServiceConfiguration {
	private config: Map<string, unknown> = new Map();
	private options: ConfigurationOptions;

	constructor(options: ConfigurationOptions = {}) {
		this.options = options;
		this.loadDefaults();
	}

	get(key: string): string | undefined {
		const value = this.config.get(key);
		return typeof value === "string" ? value : value?.toString();
	}

	getNumber(key: string): number | undefined {
		const value = this.config.get(key);
		if (typeof value === "number") return value;
		if (typeof value === "string") {
			const parsed = parseFloat(value);
			return Number.isNaN(parsed) ? undefined : parsed;
		}
		return undefined;
	}

	getBoolean(key: string): boolean | undefined {
		const value = this.config.get(key);
		if (typeof value === "boolean") return value;
		if (typeof value === "string") {
			return value.toLowerCase() === "true" || value === "1";
		}
		return undefined;
	}

	getObject<T>(key: string): T | undefined {
		const value = this.config.get(key);
		return value as T;
	}

	set(key: string, value: unknown): void {
		this.config.set(key, value);
	}

	has(key: string): boolean {
		return this.config.has(key);
	}

	getAll(): Record<string, unknown> {
		const result: Record<string, unknown> = {};
		for (const [key, value] of this.config.entries()) {
			result[key] = value;
		}
		return result;
	}

	loadFromEnvironment(): void {
		// Load all environment variables
		if (typeof process !== "undefined" && process.env) {
			for (const [key, value] of Object.entries(process.env)) {
				if (value !== undefined) {
					this.config.set(key, value);
				}
			}

			// Load environment-specific variables
			const env = this.options.environment || process.env.NODE_ENV || "development";
			const envPrefix = `${env.toUpperCase()}_`;

			for (const [key, value] of Object.entries(process.env)) {
				if (key.startsWith(envPrefix) && value !== undefined) {
					const configKey = key.substring(envPrefix.length);
					this.config.set(configKey, value);
				}
			}
		}
	}

	async loadFromFile(path: string): Promise<void> {
		try {
			// Dynamically import fs/promises to avoid issues in browser environments
			const fs = await import("node:fs/promises").catch(() => null);
			if (!fs) {
				throw new Error("File system operations not available in this environment");
			}

			const content = await fs.readFile(path, "utf-8");
			const parsed = JSON.parse(content);

			for (const [key, value] of Object.entries(parsed)) {
				this.config.set(key, value);
			}
		} catch (error) {
			throw new Error(`Failed to load configuration from file ${path}: ${error}`);
		}
	}

	validate(): boolean {
		const errors = this.getValidationErrors();
		return errors.length === 0;
	}

	getValidationErrors(): string[] {
		const errors: string[] = [];
		const requiredKeys = this.options.requiredKeys || [];

		for (const key of requiredKeys) {
			if (!this.has(key)) {
				errors.push(`Required configuration key '${key}' is missing`);
			}
		}

		return errors;
	}

	private loadDefaults(): void {
		const defaults = this.options.defaults || {};
		for (const [key, value] of Object.entries(defaults)) {
			this.config.set(key, value);
		}
	}
}
