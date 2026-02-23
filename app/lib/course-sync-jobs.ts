import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { createSanityClient } from "@superteam-academy/cms";

const execFileAsync = promisify(execFile);

export type CourseSyncStatus = "queued" | "running" | "succeeded" | "failed";

export type CourseSyncJob = {
	id: string;
	idempotencyKey: string;
	documentId: string;
	courseId: string;
	status: CourseSyncStatus;
	attempts: number;
	maxAttempts: number;
	nextAttemptAt: string;
	lastError: string | null;
	createdAt: string;
	updatedAt: string;
	result?: {
		arweaveTxId?: string;
		coursePda?: string;
		createSignature?: string;
	};
};

type CourseSyncStore = {
	jobs: CourseSyncJob[];
};

const STORE_PATH = path.join(process.cwd(), ".next", "cache", "course-sync-jobs.json");
const RETRY_DELAYS_MS = [2000, 10_000, 30_000];

let storeLock: Promise<void> = Promise.resolve();
let workerRunning = false;

async function ensureStoreDir() {
	await mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readStore(): Promise<CourseSyncStore> {
	await ensureStoreDir();
	try {
		const raw = await readFile(STORE_PATH, "utf8");
		const parsed = JSON.parse(raw) as CourseSyncStore;
		return { jobs: parsed.jobs ?? [] };
	} catch {
		return { jobs: [] };
	}
}

async function writeStore(store: CourseSyncStore): Promise<void> {
	await ensureStoreDir();
	await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function withStoreLock<T>(fn: () => Promise<T>): Promise<T> {
	const previous = storeLock;
	let release: () => void = () => undefined;
	storeLock = new Promise<void>((resolve) => {
		release = resolve;
	});

	await previous;
	try {
		return await fn();
	} finally {
		release();
	}
}

function nowIso() {
	return new Date().toISOString();
}

function computeIdempotencyKey(documentId: string, courseId: string) {
	return `${documentId}:${courseId}`;
}

function parseScriptOutput(stdout: string) {
	const arweaveTxId = stdout.match(/Arweave tx id:\s*([A-Za-z0-9_-]+)/)?.[1];
	const coursePda = stdout.match(/Course PDA:\s*([1-9A-HJ-NP-Za-km-z]+)/)?.[1];
	const createSignature = stdout.match(/Signature:\s*([1-9A-HJ-NP-Za-km-z]+)/)?.[1];
	return { arweaveTxId, coursePda, createSignature };
}

function sanityClient() {
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_API_READ_TOKEN;

	if (!projectId || !token) return null;
	return createSanityClient({ projectId, dataset, token, useCdn: false });
}

async function patchLifecycle(
	documentId: string,
	payload: {
		onchainStatus: string;
		arweaveTxId?: string;
		coursePda?: string;
		createSignature?: string;
		lastSyncError?: string | null;
	}
) {
	const client = sanityClient();
	if (!client) return;

	await client
		.patch(documentId)
		.set({
			onchainStatus: payload.onchainStatus,
			...(payload.arweaveTxId ? { arweaveTxId: payload.arweaveTxId } : {}),
			...(payload.coursePda ? { coursePda: payload.coursePda } : {}),
			...(payload.createSignature ? { createSignature: payload.createSignature } : {}),
			...(payload.lastSyncError !== undefined
				? { lastSyncError: payload.lastSyncError }
				: {}),
		})
		.commit({ autoGenerateArrayKeys: true });
}

async function executeCourseSync(job: CourseSyncJob) {
	const repoRoot = process.cwd().replace(/\/frontend$/, "");
	const arweaveKey = process.env.ARWEAVE_KEYFILE;
	if (!arweaveKey) {
		throw new Error("ARWEAVE_KEYFILE is required for on-chain sync");
	}

	const { stdout, stderr } = await execFileAsync(
		"bun",
		[
			"run",
			"ts-node",
			"scripts/create-all-courses.ts",
			"--only",
			job.courseId,
			"--skipExisting",
			"false",
			"--arweaveKey",
			arweaveKey,
		],
		{ cwd: path.join(repoRoot, "onchain-academy"), env: process.env }
	);

	if (stderr?.trim()) {
		console.warn("course sync stderr:", stderr);
	}

	return parseScriptOutput(stdout);
}

async function markLifecycleState(job: CourseSyncJob) {
	await patchLifecycle(job.documentId, {
		onchainStatus: job.status,
		...(job.result?.arweaveTxId ? { arweaveTxId: job.result.arweaveTxId } : {}),
		...(job.result?.coursePda ? { coursePda: job.result.coursePda } : {}),
		...(job.result?.createSignature ? { createSignature: job.result.createSignature } : {}),
		...(job.lastError !== null ? { lastSyncError: job.lastError } : { lastSyncError: null }),
	});
}

async function updateJob(updated: CourseSyncJob) {
	await withStoreLock(async () => {
		const store = await readStore();
		store.jobs = store.jobs.map((job) => (job.id === updated.id ? updated : job));
		await writeStore(store);
	});
}

async function pickNextRunnableJob(): Promise<CourseSyncJob | null> {
	return withStoreLock(async () => {
		const store = await readStore();
		const now = Date.now();

		const next = store.jobs
			.filter(
				(job) =>
					(job.status === "queued" || job.status === "failed") &&
					new Date(job.nextAttemptAt).getTime() <= now &&
					job.attempts < job.maxAttempts
			)
			.sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];

		if (!next) return null;

		const running: CourseSyncJob = {
			...next,
			status: "running",
			attempts: next.attempts + 1,
			updatedAt: nowIso(),
		};
		store.jobs = store.jobs.map((job) => (job.id === running.id ? running : job));
		await writeStore(store);
		return running;
	});
}

async function finalizeJobSuccess(job: CourseSyncJob, result: CourseSyncJob["result"]) {
	const updated: CourseSyncJob = {
		...job,
		status: "succeeded",
		lastError: null,
		...(result ? { result } : {}),
		updatedAt: nowIso(),
	};
	await updateJob(updated);
	await markLifecycleState(updated);
}

async function finalizeJobFailure(job: CourseSyncJob, error: unknown) {
	const message = error instanceof Error ? error.message : "Unknown sync error";
	const retryIndex = Math.min(job.attempts - 1, RETRY_DELAYS_MS.length - 1);
	const delay = RETRY_DELAYS_MS[retryIndex] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
	const hasRemainingAttempts = job.attempts < job.maxAttempts;

	const updated: CourseSyncJob = {
		...job,
		status: hasRemainingAttempts ? "queued" : "failed",
		lastError: message,
		nextAttemptAt: new Date(Date.now() + delay).toISOString(),
		updatedAt: nowIso(),
	};
	await updateJob(updated);
	await markLifecycleState(updated);
}

export async function enqueueCourseSyncJob(documentId: string, courseId: string) {
	return withStoreLock(async () => {
		const store = await readStore();
		const idempotencyKey = computeIdempotencyKey(documentId, courseId);
		const existing = store.jobs.find(
			(job) =>
				job.idempotencyKey === idempotencyKey &&
				(job.status === "queued" || job.status === "running" || job.status === "succeeded")
		);
		if (existing) return existing;

		const createdAt = nowIso();
		const job: CourseSyncJob = {
			id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			idempotencyKey,
			documentId,
			courseId,
			status: "queued",
			attempts: 0,
			maxAttempts: 3,
			nextAttemptAt: createdAt,
			lastError: null,
			createdAt,
			updatedAt: createdAt,
		};

		store.jobs.push(job);
		await writeStore(store);
		await patchLifecycle(documentId, {
			onchainStatus: "queued",
			lastSyncError: null,
		});
		return job;
	});
}

export async function getCourseSyncJobs(limit = 50) {
	const store = await readStore();
	return [...store.jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function processCourseSyncQueue() {
	if (workerRunning) return;
	workerRunning = true;

	try {
		while (true) {
			const job = await pickNextRunnableJob();
			if (!job) break;

			await markLifecycleState(job);
			try {
				const result = await executeCourseSync(job);
				await finalizeJobSuccess(job, {
					...(result.arweaveTxId ? { arweaveTxId: result.arweaveTxId } : {}),
					...(result.coursePda ? { coursePda: result.coursePda } : {}),
					...(result.createSignature ? { createSignature: result.createSignature } : {}),
				});
			} catch (error) {
				await finalizeJobFailure(job, error);
			}
		}
	} finally {
		workerRunning = false;
	}
}
