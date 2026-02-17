import type { ServiceHealthCheck, HealthStatus } from "../interfaces/service-health";

export class DefaultServiceHealth implements ServiceHealthCheck {
	private healthHistory = new Map<string, HealthStatus[]>();
	private maxHistorySize = 100;

	async checkHealth(serviceName: string): Promise<HealthStatus> {
		const startTime = Date.now();

		try {
			// For now, implement basic health checks
			// In a real implementation, this would check actual service endpoints
			const isHealthy = await this.performHealthCheck(serviceName);
			const responseTime = Date.now() - startTime;

			const status: HealthStatus = {
				service: serviceName,
				status: isHealthy ? "healthy" : "unhealthy",
				timestamp: new Date(),
				responseTime,
			};

			this.recordHealthStatus(status);
			return status;
		} catch (error) {
			const status: HealthStatus = {
				service: serviceName,
				status: "unhealthy",
				timestamp: new Date(),
				responseTime: Date.now() - startTime,
				error: error instanceof Error ? error.message : "Unknown error",
			};
			this.recordHealthStatus(status);
			return status;
		}
	}

	async checkAllHealth(): Promise<HealthStatus[]> {
		// Check common services
		const services = [
			"learning-progress",
			"credential",
			"leaderboard",
			"analytics",
			"auth-linking",
		];
		const healthChecks = services.map((service) => this.checkHealth(service));
		return Promise.all(healthChecks);
	}

	async getHealthHistory(serviceName: string, limit = 50): Promise<HealthStatus[]> {
		const history = this.healthHistory.get(serviceName) || [];
		return history.slice(-limit);
	}

	async isHealthy(serviceName: string): Promise<boolean> {
		const status = await this.checkHealth(serviceName);
		return status.status === "healthy";
	}

	private async performHealthCheck(_serviceName: string): Promise<boolean> {
		// Basic health check - in production this would check actual service endpoints
		// For now, return true for all services
		return true;
	}

	private recordHealthStatus(status: HealthStatus): void {
		const history = this.healthHistory.get(status.service) || [];
		history.push(status);

		// Keep only the most recent entries
		if (history.length > this.maxHistorySize) {
			history.splice(0, history.length - this.maxHistorySize);
		}

		this.healthHistory.set(status.service, history);
	}
}
