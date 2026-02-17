export interface HealthStatus {
	service: string;
	status: "healthy" | "unhealthy" | "degraded";
	timestamp: Date;
	responseTime?: number;
	error?: string;
	details?: Record<string, unknown>;
}

export interface ServiceHealthCheck {
	checkHealth(serviceName: string): Promise<HealthStatus>;
	checkAllHealth(): Promise<HealthStatus[]>;
	getHealthHistory(serviceName: string, limit?: number): Promise<HealthStatus[]>;
	isHealthy(serviceName: string): Promise<boolean>;
}
