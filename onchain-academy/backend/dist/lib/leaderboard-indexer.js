import { TOKEN_2022_PROGRAM_ID, unpackAccount } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { env } from "../config/env.js";
import { deriveLevel } from "./level.js";
function toMidnight(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
async function fetchToken2022Holders(connection, mintAddress) {
    const mint = new PublicKey(mintAddress);
    const tokenAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: mint.toBase58(),
                },
            },
        ],
    });
    const byOwner = new Map();
    for (const row of tokenAccounts) {
        try {
            const parsed = unpackAccount(row.pubkey, row.account, TOKEN_2022_PROGRAM_ID);
            const owner = parsed.owner.toBase58();
            const amount = Number(parsed.amount);
            if (!Number.isFinite(amount) || amount <= 0) {
                continue;
            }
            byOwner.set(owner, (byOwner.get(owner) ?? 0) + amount);
        }
        catch {
            // Ignore non-token or extension-incompatible account rows.
        }
    }
    return [...byOwner.entries()].map(([walletAddress, xpBalance]) => ({
        walletAddress,
        xpBalance,
    }));
}
async function fetchBaselines(prisma, wallets, referenceDate) {
    if (wallets.length === 0) {
        return {};
    }
    const rows = await prisma.leaderboardBalanceSnapshot.findMany({
        where: {
            walletAddress: { in: wallets },
            capturedAt: { lte: referenceDate },
        },
        orderBy: [{ walletAddress: "asc" }, { capturedAt: "desc" }],
        distinct: ["walletAddress"],
    });
    return rows.reduce((acc, row) => {
        acc[row.walletAddress] = row.xpBalance;
        return acc;
    }, {});
}
async function fetchIdentity(prisma, wallets) {
    if (wallets.length === 0) {
        return {};
    }
    const links = await prisma.walletLink.findMany({
        where: { address: { in: wallets } },
        include: {
            user: {
                select: {
                    displayName: true,
                    streakState: {
                        select: { currentDays: true },
                    },
                },
            },
        },
    });
    return links.reduce((acc, link) => {
        acc[link.address] = {
            displayName: link.user.displayName,
            streak: link.user.streakState?.currentDays ?? 0,
        };
        return acc;
    }, {});
}
function timeframeXp(balance, baseline) {
    if (!baseline || baseline < 0) {
        return balance;
    }
    return Math.max(0, balance - baseline);
}
export async function rebuildLeaderboardSnapshots(prisma) {
    if (!env.XP_MINT) {
        throw new Error("XP_MINT is required to rebuild leaderboard snapshots");
    }
    const now = new Date();
    const dayStart = toMidnight(now);
    const weeklyReference = new Date(dayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthlyReference = new Date(dayStart.getTime() - 30 * 24 * 60 * 60 * 1000);
    const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
    const holders = await fetchToken2022Holders(connection, env.XP_MINT);
    const wallets = holders.map((holder) => holder.walletAddress);
    const [weeklyBaselines, monthlyBaselines, identity] = await Promise.all([
        fetchBaselines(prisma, wallets, weeklyReference),
        fetchBaselines(prisma, wallets, monthlyReference),
        fetchIdentity(prisma, wallets),
    ]);
    if (holders.length === 0) {
        await prisma.leaderboardSnapshot.deleteMany({});
        return { holders: 0 };
    }
    await prisma.$transaction(async (tx) => {
        await tx.leaderboardBalanceSnapshot.createMany({
            data: holders.map((holder) => ({
                walletAddress: holder.walletAddress,
                xpBalance: holder.xpBalance,
                capturedAt: now,
            })),
        });
        await tx.leaderboardSnapshot.deleteMany({});
        const rows = holders.flatMap((holder) => {
            const profile = identity[holder.walletAddress];
            const displayName = profile?.displayName ??
                `${holder.walletAddress.slice(0, 4)}...${holder.walletAddress.slice(-4)}`;
            const streak = profile?.streak ?? 0;
            const allTimeXp = holder.xpBalance;
            const weeklyXp = timeframeXp(holder.xpBalance, weeklyBaselines[holder.walletAddress]);
            const monthlyXp = timeframeXp(holder.xpBalance, monthlyBaselines[holder.walletAddress]);
            return [
                {
                    timeframe: "all-time",
                    walletAddress: holder.walletAddress,
                    displayName,
                    xp: allTimeXp,
                    level: deriveLevel(holder.xpBalance),
                    streak,
                    capturedAt: now,
                    courseId: null,
                },
                {
                    timeframe: "weekly",
                    walletAddress: holder.walletAddress,
                    displayName,
                    xp: weeklyXp,
                    level: deriveLevel(holder.xpBalance),
                    streak,
                    capturedAt: now,
                    courseId: null,
                },
                {
                    timeframe: "monthly",
                    walletAddress: holder.walletAddress,
                    displayName,
                    xp: monthlyXp,
                    level: deriveLevel(holder.xpBalance),
                    streak,
                    capturedAt: now,
                    courseId: null,
                },
            ];
        });
        await tx.leaderboardSnapshot.createMany({ data: rows });
    });
    return { holders: holders.length };
}
