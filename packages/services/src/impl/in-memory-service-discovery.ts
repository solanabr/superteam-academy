import type { ServiceDiscovery, ServiceEndpoint } from "../interfaces/service-discovery";

export class InMemoryServiceDiscovery implements ServiceDiscovery {
	private services = new Map<string, ServiceEndpoint>();

	async registerService(name: string, url: string): Promise<void> {
		const endpoint: ServiceEndpoint = {
			name,
			url,
			health: "unknown",
			lastChecked: new Date(),
		};
		this.services.set(name, endpoint);
	}

	async unregisterService(name: string): Promise<void> {
		this.services.delete(name);
	}

	async discoverService(name: string): Promise<ServiceEndpoint | null> {
		const service = this.services.get(name);
		if (!service) return null;

		// Perform health check before returning
		const isHealthy = await this.healthCheck(name);
		service.health = isHealthy ? "healthy" : "unhealthy";
		service.lastChecked = new Date();

		return service;
	}

	async getAllServices(): Promise<ServiceEndpoint[]> {
		const services = Array.from(this.services.values());

		// Update health status for all services
		await Promise.all(
			services.map(async (service) => {
				const isHealthy = await this.healthCheck(service.name);
				service.health = isHealthy ? "healthy" : "unhealthy";
				service.lastChecked = new Date();
			})
		);

		return services;
	}

	async healthCheck(name: string): Promise<boolean> {
		const service = this.services.get(name);
		if (!service) return false;

		try {
			const startTime = Date.now();
			const response = await fetch(`${service.url}/health`, {
				method: "GET",
				signal: AbortSignal.timeout(5000),
			});

			const responseTime = Date.now() - startTime;
			service.responseTime = responseTime;

			return response.ok;
		} catch (_error) {
			return false;
		}
	}

	async healthCheckAll(): Promise<Map<string, boolean>> {
		const results = new Map<string, boolean>();

		const healthChecks = Array.from(this.services.keys()).map(async (name) => {
			const isHealthy = await this.healthCheck(name);
			results.set(name, isHealthy);
		});

		await Promise.all(healthChecks);
		return results;
	}
}
