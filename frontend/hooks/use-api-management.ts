/**
 * API Management Hook
 * Manages API keys, endpoints, and usage tracking
 */

import { useState, useEffect, useCallback } from "react";

interface ApiKey {
	id: string;
	name: string;
	secret: string;
	status: "active" | "revoked";
	createdAt: Date;
	lastUsed?: Date;
	rateLimit: number;
	usage: {
		today: number;
		month: number;
	};
}

interface ApiEndpoint {
	id: string;
	method: string;
	path: string;
	description: string;
	category: string;
	authRequired: boolean;
	enabled: boolean;
	requests: number;
}

interface UsageStats {
	totalRequests: number;
	avgResponseTime: number;
	successRate: number;
	byEndpoint: Array<{
		path: string;
		method: string;
		requests: number;
		errors: number;
	}>;
}

export function useApiManagement(_userId: string) {
	const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
	const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
	const [usage, setUsage] = useState<UsageStats>({
		totalRequests: 0,
		avgResponseTime: 0,
		successRate: 0,
		byEndpoint: [],
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const toDate = (value?: string) => (value ? new Date(value) : undefined);

	const loadApiData = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/platform/api-management", {
				method: "GET",
				cache: "no-store",
			});
			if (!response.ok) {
				throw new Error("Unable to load API management data");
			}

			const payload = (await response.json()) as {
				apiKeys: Array<
					Omit<ApiKey, "createdAt" | "lastUsed"> & {
						createdAt: string;
						lastUsed?: string;
					}
				>;
				endpoints: ApiEndpoint[];
				usage: UsageStats;
			};

			setApiKeys(
				payload.apiKeys.map((key) => {
					const { lastUsed: rawLastUsed, ...rest } = key;
					const lastUsed = toDate(rawLastUsed);
					return {
						...rest,
						createdAt: new Date(rest.createdAt),
						...(lastUsed ? { lastUsed } : {}),
					};
				})
			);
			setEndpoints(payload.endpoints);
			setUsage(payload.usage);
			setError(null);
		} catch (_err) {
			setError("Failed to load API data");
		} finally {
			setLoading(false);
		}
	}, [toDate]);

	useEffect(() => {
		loadApiData();
	}, [loadApiData]);

	const createApiKey = async (name: string) => {
		const response = await fetch("/api/platform/api-management", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "create", name }),
		});
		if (!response.ok) {
			throw new Error("Unable to create API key");
		}
		await loadApiData();
	};

	const revokeApiKey = async (keyId: string) => {
		const response = await fetch("/api/platform/api-management", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "revoke", keyId }),
		});
		if (!response.ok) {
			throw new Error("Unable to revoke API key");
		}
		await loadApiData();
	};

	const regenerateApiKey = async (keyId: string) => {
		const response = await fetch("/api/platform/api-management", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "regenerate", keyId }),
		});
		if (!response.ok) {
			throw new Error("Unable to regenerate API key");
		}
		await loadApiData();
	};

	const updateEndpointAccess = async (endpointId: string, enabled: boolean) => {
		setEndpoints((prev) =>
			prev.map((endpoint) =>
				endpoint.id === endpointId ? { ...endpoint, enabled } : endpoint
			)
		);
	};

	const getUsageStats = async () => {
		await loadApiData();
		return usage;
	};

	return {
		apiKeys,
		endpoints,
		usage,
		loading,
		error,
		createApiKey,
		revokeApiKey,
		regenerateApiKey,
		updateEndpointAccess,
		getUsageStats,
	};
}
