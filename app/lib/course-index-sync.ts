import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSanityClient } from "@superteam-academy/cms";
import { getAcademyClient, contentTxIdToArweaveUrl } from "@/lib/academy";

type SanityCourseIndexDoc = {
	_id: string;
	title?: string;
	slug?: { current?: string };
	onchainStatus?: string;
	arweaveTxId?: string;
	coursePda?: string;
	lastSyncError?: string | null;
};

type SyncFieldDelta = {
	field: "onchainStatus" | "coursePda" | "arweaveTxId" | "lastSyncError";
	before: string | null;
	after: string | null;
};

type CourseReconcileItem = {
	documentId: string;
	courseId: string;
	matchedOnchain: boolean;
	deltas: SyncFieldDelta[];
	updated: boolean;
	error?: string;
};

export type CourseIndexReconcileReport = {
	applied: boolean;
	totalSanityCourses: number;
	totalOnchainCourses: number;
	changed: number;
	unchanged: number;
	failed: number;
	items: CourseReconcileItem[];
};

type CourseIndexSyncState = {
	lastRunAt?: string;
	running?: boolean;
	lastError?: string | null;
	lastSummary?: {
		changed: number;
		unchanged: number;
		failed: number;
		totalSanityCourses: number;
		totalOnchainCourses: number;
	};
};

export type CourseIndexAutoRunResult = {
	executed: boolean;
	skippedReason?: "cooldown" | "already-running";
	lastRunAt?: string;
	report?: CourseIndexReconcileReport;
};

const STATE_PATH = path.join(process.cwd(), ".next", "cache", "course-index-sync-state.json");
let stateLock: Promise<void> = Promise.resolve();

async function ensureStateDir() {
	await mkdir(path.dirname(STATE_PATH), { recursive: true });
}

async function readState(): Promise<CourseIndexSyncState> {
	await ensureStateDir();
	try {
		const raw = await readFile(STATE_PATH, "utf8");
		return JSON.parse(raw) as CourseIndexSyncState;
	} catch {
		return {};
	}
}

async function writeState(state: CourseIndexSyncState) {
	await ensureStateDir();
	await writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

async function withStateLock<T>(fn: () => Promise<T>): Promise<T> {
	const previous = stateLock;
	let release: () => void = () => undefined;
	stateLock = new Promise<void>((resolve) => {
		release = resolve;
	});

	await previous;
	try {
		return await fn();
	} finally {
		release();
	}
}

function sanityReadClient() {
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_READ_TOKEN;
	if (!projectId || !token) return null;
	return createSanityClient({ projectId, dataset, token, useCdn: false });
}

function sanityWriteClient() {
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_WRITE_TOKEN;
	if (!projectId || !token) return null;
	return createSanityClient({ projectId, dataset, token, useCdn: false });
}

function normalizeArweaveTxId(contentTxIdBytes: Uint8Array): string {
	const url = contentTxIdToArweaveUrl(contentTxIdBytes);
	return url.split("/").at(-1) ?? "";
}

function normalizeCourseId(doc: SanityCourseIndexDoc): string | null {
	const slug = doc.slug?.current?.trim();
	if (slug) return slug;
	return null;
}

function toNullableString(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const normalized = value.trim();
	return normalized.length > 0 ? normalized : null;
}

export async function reconcileCourseIndex(options?: {
	apply?: boolean;
}): Promise<CourseIndexReconcileReport> {
	const apply = options?.apply === true;
	const readClient = sanityReadClient();
	if (!readClient) {
		throw new Error("Sanity read token is not configured");
	}

	const writeClient = apply ? sanityWriteClient() : null;
	if (apply && !writeClient) {
		throw new Error("Sanity write token is not configured");
	}

	const academyClient = getAcademyClient();
	const [sanityCourses, onchainCourses] = await Promise.all([
		readClient.fetch<SanityCourseIndexDoc[]>(
			`*[_type == "course"]{ _id, title, slug, onchainStatus, arweaveTxId, coursePda, lastSyncError }`
		),
		academyClient.fetchAllCourses(),
	]);

	const onchainByCourseId = new Map(
		onchainCourses.map((entry) => [
			entry.account.courseId,
			{
				coursePda: entry.pubkey.toBase58(),
				arweaveTxId: normalizeArweaveTxId(entry.account.contentTxId),
			},
		])
	);

	const items: CourseReconcileItem[] = [];
	let changed = 0;
	let unchanged = 0;
	let failed = 0;

	for (const course of sanityCourses) {
		const courseId = normalizeCourseId(course);
		if (!courseId) {
			items.push({
				documentId: course._id,
				courseId: "",
				matchedOnchain: false,
				deltas: [],
				updated: false,
				error: "Missing slug.current for course",
			});
			failed += 1;
			continue;
		}

		const onchain = onchainByCourseId.get(courseId);
		const targetStatus = onchain ? "succeeded" : "draft";
		const targetCoursePda = onchain?.coursePda ?? null;
		const targetArweaveTxId = onchain?.arweaveTxId ?? null;
		const targetLastSyncError = null;

		const currentStatus = toNullableString(course.onchainStatus) ?? "draft";
		const currentCoursePda = toNullableString(course.coursePda);
		const currentArweaveTxId = toNullableString(course.arweaveTxId);
		const currentLastSyncError = toNullableString(course.lastSyncError);

		const deltas: SyncFieldDelta[] = [];
		if (currentStatus !== targetStatus) {
			deltas.push({ field: "onchainStatus", before: currentStatus, after: targetStatus });
		}
		if (currentCoursePda !== targetCoursePda) {
			deltas.push({ field: "coursePda", before: currentCoursePda, after: targetCoursePda });
		}
		if (currentArweaveTxId !== targetArweaveTxId) {
			deltas.push({
				field: "arweaveTxId",
				before: currentArweaveTxId,
				after: targetArweaveTxId,
			});
		}
		if (currentLastSyncError !== targetLastSyncError) {
			deltas.push({
				field: "lastSyncError",
				before: currentLastSyncError,
				after: targetLastSyncError,
			});
		}

		let updated = false;
		let itemError: string | undefined;

		if (deltas.length > 0) {
			changed += 1;
			if (apply && writeClient) {
				try {
					const patch = writeClient.patch(course._id).set({ onchainStatus: targetStatus });
					if (targetCoursePda) {
						patch.set({ coursePda: targetCoursePda });
					} else {
						patch.unset(["coursePda"]);
					}

					if (targetArweaveTxId) {
						patch.set({ arweaveTxId: targetArweaveTxId });
					} else {
						patch.unset(["arweaveTxId"]);
					}

					patch.unset(["lastSyncError"]);
					await patch.commit({ autoGenerateArrayKeys: true });
					updated = true;
				} catch (error) {
					failed += 1;
					itemError = error instanceof Error ? error.message : "Failed to patch Sanity";
				}
			}
		} else {
			unchanged += 1;
		}

		items.push({
			documentId: course._id,
			courseId,
			matchedOnchain: Boolean(onchain),
			deltas,
			updated,
			...(itemError ? { error: itemError } : {}),
		});
	}

	return {
		applied: apply,
		totalSanityCourses: sanityCourses.length,
		totalOnchainCourses: onchainCourses.length,
		changed,
		unchanged,
		failed,
		items,
	};
}

export async function maybeRunAutoCourseIndexReconcile(options?: {
	minIntervalMs?: number;
	force?: boolean;
}): Promise<CourseIndexAutoRunResult> {
	const minIntervalMs = options?.minIntervalMs ?? 5 * 60 * 1000;
	const force = options?.force === true;

	return withStateLock(async () => {
		const state = await readState();
		if (state.running) {
			return {
				executed: false,
				skippedReason: "already-running",
				...(state.lastRunAt ? { lastRunAt: state.lastRunAt } : {}),
			};
		}

		if (!force && state.lastRunAt) {
			const elapsed = Date.now() - new Date(state.lastRunAt).getTime();
			if (Number.isFinite(elapsed) && elapsed < minIntervalMs) {
				return {
					executed: false,
					skippedReason: "cooldown",
					lastRunAt: state.lastRunAt,
				};
			}
		}

		await writeState({ ...state, running: true, lastError: null });

		try {
			const report = await reconcileCourseIndex({ apply: true });
			const lastRunAt = new Date().toISOString();
			await writeState({
				running: false,
				lastRunAt,
				lastError: null,
				lastSummary: {
					changed: report.changed,
					unchanged: report.unchanged,
					failed: report.failed,
					totalSanityCourses: report.totalSanityCourses,
					totalOnchainCourses: report.totalOnchainCourses,
				},
			});

			return {
				executed: true,
				lastRunAt,
				report,
			};
		} catch (error) {
			await writeState({
				running: false,
				...(state.lastRunAt ? { lastRunAt: state.lastRunAt } : {}),
				lastError: error instanceof Error ? error.message : "Course index reconcile failed",
				...(state.lastSummary ? { lastSummary: state.lastSummary } : {}),
			});
			throw error;
		}
	});
}
