import { PublicKey } from "@solana/web3.js";
import { BaseService } from "./types";
import { AcademyClient, countCompletedLessons } from "@superteam-academy/anchor";
import { findToken2022ATA } from "@superteam-academy/solana";
import { incrementMetric, recordDuration } from "@/lib/runtime-observability";

export interface LeaderboardEntry {
	rank: number;
	publicKey: string;
	xpBalance: bigint;
}

export class LeaderboardService extends BaseService {
	private client: AcademyClient;

	constructor(...args: ConstructorParameters<typeof BaseService>) {
		super(...args);
		this.client = new AcademyClient(this.connection, this.programId);
	}

	async getUserXp(learner: PublicKey, xpMint: PublicKey): Promise<bigint> {
		const ata = findToken2022ATA(learner, xpMint);
		const balance = await this.client.fetchXpBalance(ata);
		return balance ?? 0n;
	}

	async getLeaderboard(xpMint: PublicKey, limit: number): Promise<LeaderboardEntry[]> {
		const startedAt = performance.now();
		incrementMetric("leaderboard.global.index.requests.total");
		const largest = await this.connection.getTokenLargestAccounts(xpMint);
		const topTokenAccounts = largest.value.slice(0, Math.max(limit * 2, limit));
		if (topTokenAccounts.length === 0) {
			incrementMetric("leaderboard.global.index.requests.empty");
			recordDuration("leaderboard.global.index.duration_ms", performance.now() - startedAt);
			return [];
		}

		const accountPubkeys = topTokenAccounts.map((entry) => entry.address);
		const infos = await this.connection.getMultipleAccountsInfo(accountPubkeys);

		const byOwner = new Map<string, bigint>();
		for (const info of infos) {
			if (!info || info.data.length < 72) continue;
			const owner = new PublicKey(info.data.subarray(32, 64)).toBase58();
			const amount = info.data.readBigUInt64LE(64);
			const current = byOwner.get(owner) ?? 0n;
			if (amount > current) {
				byOwner.set(owner, amount);
			}
		}

		const results = [...byOwner.entries()]
			.sort((a, b) => (a[1] > b[1] ? -1 : 1))
			.slice(0, limit)
			.map(([publicKey, xpBalance], index) => ({
				rank: index + 1,
				publicKey,
				xpBalance,
			}));

		incrementMetric("leaderboard.global.index.requests.success");
		recordDuration("leaderboard.global.index.duration_ms", performance.now() - startedAt);
		return results;
	}

	async getCourseLeaderboard(courseId: string, limit: number): Promise<LeaderboardEntry[]> {
		const startedAt = performance.now();
		incrementMetric("leaderboard.course.index.requests.total");
		const allEnrollments = await this.client.fetchAllEnrollments();
		const allCourses = await this.client.fetchAllCourses();

		const coursePubkey = allCourses.find((c) => c.account.courseId === courseId)?.pubkey;
		if (!coursePubkey) {
			incrementMetric("leaderboard.course.index.requests.missing_course");
			recordDuration("leaderboard.course.index.duration_ms", performance.now() - startedAt);
			return [];
		}

		const courseKey = coursePubkey.toBase58();
		const courseEnrollments = allEnrollments.filter(
			(e) => e.account.course.toBase58() === courseKey
		);

		const courseAccount = allCourses.find((c) => c.account.courseId === courseId)?.account;
		const xpPerLesson = courseAccount?.xpPerLesson ?? 0;

		const results = courseEnrollments
			.map((e) => {
				const completed = countCompletedLessons(e.account.lessonFlags);
				return {
					pubkey: e.pubkey,
					xpBalance: BigInt(completed * xpPerLesson),
				};
			})
			.sort((a, b) => (a.xpBalance > b.xpBalance ? -1 : 1))
			.slice(0, limit)
			.map((entry, index) => ({
				rank: index + 1,
				publicKey: entry.pubkey.toBase58(),
				xpBalance: entry.xpBalance,
			}));

		incrementMetric("leaderboard.course.index.requests.success");
		recordDuration("leaderboard.course.index.duration_ms", performance.now() - startedAt);
		return results;
	}
}
