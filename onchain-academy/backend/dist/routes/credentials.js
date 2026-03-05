import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { deriveLevel } from "../lib/level.js";
import { mockCredentials } from "../data/mock-credentials.js";
function parseNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return null;
}
function readAttribute(asset, keys) {
    const attrs = asset.content?.metadata?.attributes ?? [];
    for (const key of keys) {
        const match = attrs.find((attribute) => attribute.trait_type?.toLowerCase() === key.toLowerCase());
        if (match?.value !== undefined) {
            return match.value;
        }
    }
    return undefined;
}
function parseCollectionAllowList() {
    const raw = env.CREDENTIAL_COLLECTIONS ?? "";
    if (!raw.trim()) {
        return new Set();
    }
    return new Set(raw
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean));
}
function matchesExpectedCollection(asset, allowList) {
    if (allowList.size === 0) {
        return true;
    }
    const groupings = asset.grouping ?? [];
    return groupings.some((group) => group.group_key === "collection" &&
        group.group_value !== undefined &&
        allowList.has(group.group_value));
}
function hasCredentialShape(asset) {
    const track = readAttribute(asset, ["track", "track_id"]);
    const level = readAttribute(asset, ["level"]);
    const totalXp = readAttribute(asset, ["total_xp", "xp", "totalXp"]);
    const courses = readAttribute(asset, [
        "courses_completed",
        "coursesCompleted",
    ]);
    return (track !== undefined &&
        (level !== undefined || totalXp !== undefined || courses !== undefined));
}
function parseCredential(asset, ownerWallet) {
    const title = asset.content?.metadata?.name ?? "Credential";
    const track = String(readAttribute(asset, ["track", "track_id"]) ?? "Unknown");
    const totalXp = parseNumber(readAttribute(asset, ["total_xp", "xp", "totalXp"])) ?? 0;
    const levelFromAttribute = parseNumber(readAttribute(asset, ["level"]));
    const coursesCompleted = parseNumber(readAttribute(asset, ["courses_completed", "coursesCompleted"])) ?? 0;
    const level = levelFromAttribute ?? deriveLevel(totalXp);
    const mintAddress = asset.id;
    const explorerUrl = `https://explorer.solana.com/address/${mintAddress}?cluster=${env.SOLANA_CLUSTER}`;
    const verified = (asset.ownership?.owner ?? ownerWallet) === ownerWallet;
    return {
        credentialId: asset.id,
        title,
        track,
        level,
        coursesCompleted,
        totalXp,
        mintAddress,
        metadataUri: asset.content?.json_uri ?? null,
        explorerUrl,
        verified,
        source: "helius",
    };
}
async function fetchFromHelius(wallet) {
    if (!env.HELIUS_RPC_URL) {
        return [];
    }
    const collectionAllowList = parseCollectionAllowList();
    const response = await fetch(env.HELIUS_RPC_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "superteam-credentials",
            method: "getAssetsByOwner",
            params: {
                ownerAddress: wallet,
                page: 1,
                limit: 100,
            },
        }),
    });
    if (!response.ok) {
        return [];
    }
    const data = (await response.json());
    const items = data.result?.items ?? [];
    const parsed = items
        .filter((item) => hasCredentialShape(item))
        .filter((item) => matchesExpectedCollection(item, collectionAllowList))
        .map((item) => parseCredential(item, wallet));
    if (parsed.length > 0) {
        await prisma.$transaction(async (tx) => {
            for (const credential of parsed) {
                await tx.credentialCache.upsert({
                    where: {
                        walletAddress_credentialId: {
                            walletAddress: wallet,
                            credentialId: credential.credentialId,
                        },
                    },
                    update: {
                        title: credential.title,
                        track: credential.track,
                        level: credential.level,
                        mintAddress: credential.mintAddress,
                        metadataUri: credential.metadataUri,
                        verified: credential.verified,
                        syncedAt: new Date(),
                    },
                    create: {
                        walletAddress: wallet,
                        credentialId: credential.credentialId,
                        title: credential.title,
                        track: credential.track,
                        level: credential.level,
                        mintAddress: credential.mintAddress,
                        metadataUri: credential.metadataUri,
                        verified: credential.verified,
                    },
                });
            }
        });
    }
    return parsed;
}
export async function credentialRoutes(app) {
    app.get("/credentials/:wallet", async (request) => {
        const params = z
            .object({ wallet: z.string().min(32) })
            .parse(request.params);
        const heliusCredentials = await fetchFromHelius(params.wallet);
        if (heliusCredentials.length > 0) {
            return heliusCredentials;
        }
        const cached = await prisma.credentialCache.findMany({
            where: { walletAddress: params.wallet },
            orderBy: { syncedAt: "desc" },
        });
        if (cached.length > 0) {
            return cached.map((credential) => ({
                credentialId: credential.credentialId,
                title: credential.title,
                track: credential.track,
                level: credential.level,
                coursesCompleted: 0,
                totalXp: 0,
                mintAddress: credential.mintAddress,
                metadataUri: credential.metadataUri,
                explorerUrl: `https://explorer.solana.com/address/${credential.mintAddress}?cluster=${env.SOLANA_CLUSTER}`,
                verified: credential.verified,
                source: "helius",
            }));
        }
        return mockCredentials;
    });
}
