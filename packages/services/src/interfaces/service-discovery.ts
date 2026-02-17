export interface ServiceEndpoint {
	name: string;
	url: string;
	health: "healthy" | "unhealthy" | "unknown";
	lastChecked: Date;
	responseTime?: number;
}

export interface ServiceDiscovery {
	registerService(name: string, url: string): Promise<void>;
	unregisterService(name: string): Promise<void>;
	discoverService(name: string): Promise<ServiceEndpoint | null>;
	getAllServices(): Promise<ServiceEndpoint[]>;
	healthCheck(name: string): Promise<boolean>;
	healthCheckAll(): Promise<Map<string, boolean>>;
}
