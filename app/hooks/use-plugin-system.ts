/**
 * Plugin System Hook
 * Manages plugin installation, configuration, and marketplace
 */

import { useState, useEffect, useCallback } from "react";

interface Plugin {
	id: string;
	name: string;
	description: string;
	version: string;
	author: string;
	category: "editor" | "theme" | "integration" | "analytics" | "gamification" | "utility";
	rating: number;
	installs: number;
	enabled: boolean;
	settings?: Record<string, unknown>;
}

interface PluginSettings {
	[pluginId: string]: Record<string, unknown>;
}

export function usePluginSystem(_userId: string) {
	const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);
	const [availablePlugins, setAvailablePlugins] = useState<Plugin[]>([]);
	const [pluginSettings, setPluginSettings] = useState<PluginSettings>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadPlugins = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/platform/plugins", {
				method: "GET",
				cache: "no-store",
			});
			if (!response.ok) {
				throw new Error("Unable to load plugins");
			}
			const payload = (await response.json()) as {
				installedPlugins: Plugin[];
				availablePlugins: Plugin[];
				pluginSettings: PluginSettings;
			};

			setInstalledPlugins(payload.installedPlugins);
			setAvailablePlugins(payload.availablePlugins);
			setPluginSettings(payload.pluginSettings);
			setError(null);
		} catch (_err) {
			setError("Failed to load plugins");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadPlugins();
	}, [loadPlugins]);

	const installPlugin = async (pluginId: string) => {
		const response = await fetch("/api/platform/plugins", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "install", pluginId }),
		});
		if (!response.ok) {
			throw new Error("Unable to install plugin");
		}
		await loadPlugins();
	};

	const uninstallPlugin = async (pluginId: string) => {
		const response = await fetch("/api/platform/plugins", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "uninstall", pluginId }),
		});
		if (!response.ok) {
			throw new Error("Unable to uninstall plugin");
		}
		await loadPlugins();
	};

	const updatePlugin = async (pluginId: string) => {
		const response = await fetch("/api/platform/plugins", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "update", pluginId }),
		});
		if (!response.ok) {
			throw new Error("Unable to update plugin");
		}
		await loadPlugins();
	};

	const configurePlugin = async (pluginId: string, settings: Record<string, unknown>) => {
		if (settings.enabled !== undefined) {
			const response = await fetch("/api/platform/plugins", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "toggle",
					pluginId,
					enabled: Boolean(settings.enabled),
				}),
			});
			if (!response.ok) {
				throw new Error("Unable to configure plugin");
			}
			await loadPlugins();
			return;
		}

		setPluginSettings((prev) => ({ ...prev, [pluginId]: { ...prev[pluginId], ...settings } }));
	};

	const createPlugin = async (pluginData: {
		name: string;
		description: string;
		category: string;
		code: string;
	}) => {
		const response = await fetch("/api/platform/plugins", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "create",
				plugin: {
					name: pluginData.name,
					description: pluginData.description,
					category: pluginData.category as Plugin["category"],
				},
			}),
		});
		if (!response.ok) {
			throw new Error("Unable to create plugin");
		}
		await loadPlugins();
	};

	return {
		installedPlugins,
		availablePlugins,
		pluginSettings,
		loading,
		error,
		installPlugin,
		uninstallPlugin,
		updatePlugin,
		configurePlugin,
		createPlugin,
	};
}
