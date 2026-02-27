import { type NextRequest, NextResponse } from "next/server";
import { readPlatformStore, writePlatformStore } from "@/lib/platform-store";

export async function GET() {
	const store = await readPlatformStore();
	const installed = store.plugins.filter((plugin) => plugin.enabled);
	const available = store.plugins.filter((plugin) => !plugin.enabled);

	return NextResponse.json({
		installedPlugins: installed,
		availablePlugins: available,
		pluginSettings: Object.fromEntries(installed.map((plugin) => [plugin.id, {}])),
	});
}

export async function POST(request: NextRequest) {
	const body = (await request.json()) as
		| { action: "install"; pluginId: string }
		| { action: "uninstall"; pluginId: string }
		| { action: "update"; pluginId: string }
		| { action: "toggle"; pluginId: string; enabled: boolean }
		| {
				action: "create";
				plugin: {
					name: string;
					description: string;
					category:
						| "editor"
						| "theme"
						| "integration"
						| "analytics"
						| "gamification"
						| "utility";
				};
		  };

	const store = await readPlatformStore();

	if (body.action === "install") {
		store.plugins = store.plugins.map((plugin) =>
			plugin.id === body.pluginId ? { ...plugin, enabled: true } : plugin
		);
	}
	if (body.action === "uninstall") {
		store.plugins = store.plugins.map((plugin) =>
			plugin.id === body.pluginId ? { ...plugin, enabled: false } : plugin
		);
	}
	if (body.action === "toggle") {
		store.plugins = store.plugins.map((plugin) =>
			plugin.id === body.pluginId ? { ...plugin, enabled: body.enabled } : plugin
		);
	}
	if (body.action === "update") {
		store.plugins = store.plugins.map((plugin) => {
			if (plugin.id !== body.pluginId) return plugin;
			const [major, minor, patch] = plugin.version.split(".").map((part) => Number(part));
			const nextPatch = Number.isFinite(patch) ? patch + 1 : 1;
			const nextVersion = `${Number.isFinite(major) ? major : 1}.${Number.isFinite(minor) ? minor : 0}.${nextPatch}`;
			return {
				...plugin,
				version: nextVersion,
			};
		});
	}
	if (body.action === "create") {
		store.plugins.push({
			id: `plugin-${Date.now()}`,
			name: body.plugin.name,
			description: body.plugin.description,
			version: "1.0.0",
			author: "You",
			category: body.plugin.category,
			rating: 0,
			installs: 0,
			enabled: false,
		});
	}

	await writePlatformStore(store);
	return NextResponse.json({ success: true });
}
