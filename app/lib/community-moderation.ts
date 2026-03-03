import { generateId } from "@/lib/utils";

type ModerationTarget = "discussion" | "event" | "project" | "comment";
type ModerationStatus = "approved" | "needs_review" | "rejected";

interface ModerationDecision {
	status: ModerationStatus;
	reasons: string[];
	score: number;
}

interface ModerationQueueItem {
	id: string;
	target: ModerationTarget;
	title: string;
	slug?: string;
	authorId?: string;
	status: "open" | "resolved";
	decision: ModerationDecision;
	createdAt: number;
	resolvedAt?: number;
	resolution?: "approve" | "reject";
	resolutionNote?: string;
}

const BLOCKED_TERMS = ["scam", "rugpull", "phishing", "malware", "exploit"];
const REVIEW_TERMS = ["airdrop", "giveaway", "dm me", "whitelist", "guaranteed profit"];

const moderationQueue = new Map<string, ModerationQueueItem>();

export function evaluateContentModeration(content: string): ModerationDecision {
	const normalized = content.toLowerCase();
	const reasons: string[] = [];
	let score = 0;

	for (const term of BLOCKED_TERMS) {
		if (normalized.includes(term)) {
			reasons.push(`Blocked term detected: ${term}`);
			score += 10;
		}
	}

	for (const term of REVIEW_TERMS) {
		if (normalized.includes(term)) {
			reasons.push(`Review term detected: ${term}`);
			score += 3;
		}
	}

	const repeatedLinks = normalized.match(/https?:\/\//g)?.length ?? 0;
	if (repeatedLinks > 3) {
		reasons.push("Excessive links detected");
		score += 4;
	}

	if (score >= 10) {
		return { status: "rejected", reasons, score };
	}

	if (score >= 3) {
		return { status: "needs_review", reasons, score };
	}

	return { status: "approved", reasons, score };
}

export function enqueueModerationItem(input: {
	target: ModerationTarget;
	title: string;
	slug?: string;
	authorId?: string;
	decision: ModerationDecision;
}): ModerationQueueItem {
	const id = `${input.target}-${generateId()}`;
	const item: ModerationQueueItem = {
		id,
		target: input.target,
		title: input.title,
		slug: input.slug,
		authorId: input.authorId,
		status: "open",
		decision: input.decision,
		createdAt: Date.now(),
	};
	moderationQueue.set(id, item);
	return item;
}

export function listModerationQueue(status: "open" | "resolved" | "all" = "open") {
	const values = [...moderationQueue.values()].sort((a, b) => b.createdAt - a.createdAt);
	if (status === "all") return values;
	return values.filter((item) => item.status === status);
}

export function resolveModerationItem(input: {
	id: string;
	resolution: "approve" | "reject";
	note?: string;
}): ModerationQueueItem | null {
	const item = moderationQueue.get(input.id);
	if (!item) return null;

	const updated: ModerationQueueItem = {
		...item,
		status: "resolved",
		resolvedAt: Date.now(),
		resolution: input.resolution,
		resolutionNote: input.note,
	};

	moderationQueue.set(input.id, updated);
	return updated;
}
