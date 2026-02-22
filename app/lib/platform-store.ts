import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORE_PATH = path.join(process.cwd(), ".next", "cache", "platform-store.json");

export type PlatformStore = {
	apiKeys: Array<{
		id: string;
		name: string;
		secret: string;
		status: "active" | "revoked";
		createdAt: string;
		lastUsed?: string;
		rateLimit: number;
		usage: { today: number; month: number };
	}>;
	hackathon: {
		id: string;
		name: string;
		description: string;
		status: "upcoming" | "active" | "ended";
		startDate: string;
		endDate: string;
		rules: string[];
		prizes: Array<{ position: string; amount: string; description: string }>;
		participants: number;
	};
	teams: Array<{
		id: string;
		name: string;
		members: Array<{ id: string; name: string }>;
		maxSize: number;
		project?: {
			name: string;
			description: string;
			techStack: string[];
			repoUrl: string;
		};
	}>;
	submissions: Array<{
		id: string;
		teamId: string;
		votes: number;
		submittedAt: string;
		project: {
			name: string;
			description: string;
			techStack: string[];
			repoUrl: string;
		};
	}>;
	plugins: Array<{
		id: string;
		name: string;
		description: string;
		version: string;
		author: string;
		category: "editor" | "theme" | "integration" | "analytics" | "gamification" | "utility";
		rating: number;
		installs: number;
		enabled: boolean;
	}>;
	subscriptionByUser: Record<
		string,
		{
			id: string;
			planId: string;
			status: "active" | "canceled" | "past_due" | "incomplete";
			currentPeriodStart: string;
			currentPeriodEnd: string;
			cancelAtPeriodEnd: boolean;
		}
	>;
};

const defaultStore: PlatformStore = {
	apiKeys: [
		{
			id: "key-default",
			name: "Default API Key",
			secret: "sk_default_******",
			status: "active",
			createdAt: new Date().toISOString(),
			rateLimit: 1000,
			usage: { today: 0, month: 0 },
		},
	],
	hackathon: {
		id: "hackathon-2026",
		name: "Superteam Solana Hackathon",
		description: "Build production-grade Solana learning experiences.",
		status: "active",
		startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
		rules: [
			"Projects must be open source",
			"Projects must use Solana",
			"Team size: 2-4 members",
		],
		prizes: [
			{ position: "1st", amount: "5000 USDC", description: "Grand Prize" },
			{ position: "2nd", amount: "3000 USDC", description: "Runner Up" },
			{ position: "3rd", amount: "1000 USDC", description: "Third Place" },
		],
		participants: 0,
	},
	teams: [],
	submissions: [],
	plugins: [
		{
			id: "plugin-code-format",
			name: "Code Formatter",
			description: "Automatic code formatting",
			version: "1.0.0",
			author: "Superteam",
			category: "editor",
			rating: 4.8,
			installs: 120,
			enabled: true,
		},
	],
	subscriptionByUser: {},
};

async function ensureStoreDir() {
	await mkdir(path.dirname(STORE_PATH), { recursive: true });
}

export async function readPlatformStore(): Promise<PlatformStore> {
	await ensureStoreDir();
	try {
		const raw = await readFile(STORE_PATH, "utf8");
		return { ...defaultStore, ...(JSON.parse(raw) as Partial<PlatformStore>) };
	} catch {
		return structuredClone(defaultStore);
	}
}

export async function writePlatformStore(store: PlatformStore) {
	await ensureStoreDir();
	await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}
