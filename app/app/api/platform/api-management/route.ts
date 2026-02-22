import { type NextRequest, NextResponse } from "next/server";
import { readdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { readPlatformStore, writePlatformStore } from "@/lib/platform-store";

function generateApiSecret(): string {
	return `sk_${randomBytes(12).toString("hex")}`;
}

async function listApiRoutes(dir: string, base = "/api"): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const routes: string[] = [];
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			routes.push(...(await listApiRoutes(fullPath, `${base}/${entry.name}`)));
		} else if (entry.isFile() && entry.name === "route.ts") {
			routes.push(base);
		}
	}
	return routes;
}

export async function GET() {
	const store = await readPlatformStore();
	const apiRoot = path.join(process.cwd(), "app", "api");
	const routes = await listApiRoutes(apiRoot);

	const endpoints = routes
		.filter((route) => !route.includes("/platform/api-management"))
		.map((route, index) => ({
			id: `ep-${index + 1}`,
			method: "GET",
			path: route,
			description: `Endpoint ${route}`,
			category: route.split("/")[2] ?? "general",
			authRequired: route.includes("/auth"),
			enabled: true,
			requests: 0,
		}));

	const usage = {
		totalRequests: store.apiKeys.reduce((sum, key) => sum + key.usage.month, 0),
		avgResponseTime: 120,
		successRate: 99.9,
		byEndpoint: endpoints.map((endpoint) => ({
			path: endpoint.path,
			method: endpoint.method,
			requests: endpoint.requests,
			errors: 0,
		})),
	};

	return NextResponse.json({ apiKeys: store.apiKeys, endpoints, usage });
}

export async function POST(request: NextRequest) {
	const body = (await request.json()) as
		| { action: "create"; name: string }
		| { action: "revoke"; keyId: string }
		| { action: "regenerate"; keyId: string };

	const store = await readPlatformStore();

	if (body.action === "create") {
		store.apiKeys.push({
			id: `key-${Date.now()}`,
			name: body.name,
			secret: generateApiSecret(),
			status: "active",
			createdAt: new Date().toISOString(),
			rateLimit: 1000,
			usage: { today: 0, month: 0 },
		});
	}

	if (body.action === "revoke") {
		store.apiKeys = store.apiKeys.map((key) =>
			key.id === body.keyId ? { ...key, status: "revoked" } : key
		);
	}

	if (body.action === "regenerate") {
		store.apiKeys = store.apiKeys.map((key) =>
			key.id === body.keyId
				? {
						...key,
						secret: generateApiSecret(),
						createdAt: new Date().toISOString(),
					}
				: key
		);
	}

	await writePlatformStore(store);
	return NextResponse.json({ success: true });
}
