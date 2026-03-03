/**
 * POST /api/achievements/award
 *
 * Awards an achievement to a user — mints NFT badge + XP on-chain
 * via the award_achievement instruction.
 *
 * Body: { achievementId: string, learnerWallet: string }
 *
 * Flow:
 * 1. Validate achievement exists and user is eligible
 * 2. Check double-claim via DB unique constraint
 * 3. Verify wallet ownership via linked_accounts
 * 4. Ensure recipient XP ATA exists
 * 5. Call award_achievement on-chain (mints NFT + XP)
 * 6. Store tx signature + asset address in DB
 */
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { ACHIEVEMENTS } from '@/backend/achievements';
import { prisma } from '@/backend/prisma';
import { TransactionBuilder } from '@/context/solana/tx-builder';
import { loadBackendSigner } from '@/context/solana/backend-signer';
import { PROGRAM_ID, XP_MINT } from '@/context/solana/constants';
import { ensureXpAta } from '@/context/solana/xp';
import { getRpcUrl, safeErrorDetails } from '@/context/env';
import { deriveAchievementTypePda } from '@/context/solana/pda';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { achievementId, learnerWallet } = body;

        if (!achievementId || typeof achievementId !== 'string') {
            return NextResponse.json(
                { error: 'achievementId is required' },
                { status: 400 }
            );
        }

        // Validate achievement exists in definitions
        const definition = ACHIEVEMENTS.find((a) => a.id === achievementId);
        if (!definition) {
            return NextResponse.json(
                { error: `Unknown achievement: ${achievementId}` },
                { status: 404 }
            );
        }

        // Validate wallet
        if (!learnerWallet || typeof learnerWallet !== 'string') {
            return NextResponse.json(
                { error: 'learnerWallet is required. Connect your wallet to claim this badge.' },
                { status: 400 }
            );
        }

        let learner: PublicKey;
        try {
            learner = new PublicKey(learnerWallet);
        } catch {
            return NextResponse.json(
                { error: 'Invalid wallet address.' },
                { status: 400 }
            );
        }

        // Verify wallet ownership
        const linkedAccount = await prisma.linked_accounts.findFirst({
            where: {
                user_id: session.user.id,
                provider: 'wallet',
                provider_id: learnerWallet,
            },
            select: { provider_id: true },
        });

        if (!linkedAccount) {
            return NextResponse.json(
                { error: 'Wallet does not belong to authenticated user.' },
                { status: 403 }
            );
        }

        // Upsert achievement (unique constraint prevents double-claim)
        const existingAward = await prisma.achievements.findUnique({
            where: {
                user_id_achievement_id: {
                    user_id: session.user.id,
                    achievement_id: achievementId,
                },
            },
        });

        if (existingAward?.tx_hash) {
            return NextResponse.json(
                { error: 'Achievement already claimed on-chain' },
                { status: 409 }
            );
        }

        // Mint NFT badge + XP on-chain via award_achievement
        const connection = new Connection(getRpcUrl(), 'confirmed');
        const backendSigner = loadBackendSigner();

        await ensureXpAta(connection, learner, backendSigner);

        // Fetch the achievement type collection from on-chain
        const [achievementTypePda] = deriveAchievementTypePda(achievementId);
        let collection: PublicKey;
        try {
            const achievementTypeAccount = await connection.getAccountInfo(achievementTypePda);
            if (!achievementTypeAccount) {
                // Achievement type doesn't exist on-chain yet — fall back to reward_xp
                console.warn(`[Achievements] No on-chain achievement type for ${achievementId}, using reward_xp fallback`);

                const txBuilder = new TransactionBuilder({
                    connection,
                    backendSigner,
                    programId: PROGRAM_ID,
                    xpMint: XP_MINT,
                });

                const memo = `achievement:${achievementId}`;
                const result = await txBuilder.rewardXp(learner, definition.xpReward, memo);

                // Store in DB
                await prisma.achievements.upsert({
                    where: {
                        user_id_achievement_id: {
                            user_id: session.user.id,
                            achievement_id: achievementId,
                        },
                    },
                    update: {
                        tx_hash: result.signature,
                    },
                    create: {
                        user_id: session.user.id,
                        achievement_id: achievementId,
                        tx_hash: result.signature,
                    },
                });

                return NextResponse.json({
                    awarded: true,
                    achievementId,
                    name: definition.name,
                    xpReward: definition.xpReward,
                    signature: result.signature,
                    asset: null,
                    badge: definition.badge,
                });
            }

            // Parse the collection pubkey from the achievement type account data
            // The collection field is at a known offset in the account data
            // For now, use the achievement type PDA itself as a reference to find collection
            // The Anchor deserialization includes an 8-byte discriminator
            // AchievementType { achievement_id, name, metadata_uri, xp_reward, max_supply, supply, collection, active, bump }
            // collection is a Pubkey (32 bytes) — we need to parse it from the account data
            const data = achievementTypeAccount.data;
            // Skip discriminator (8 bytes), then parse strings (4-byte len prefix + string bytes)
            let offset = 8;
            // achievement_id string
            const aidLen = data.readUInt32LE(offset); offset += 4 + aidLen;
            // name string
            const nameLen = data.readUInt32LE(offset); offset += 4 + nameLen;
            // metadata_uri string
            const uriLen = data.readUInt32LE(offset); offset += 4 + uriLen;
            // xp_reward (u32)
            offset += 4;
            // max_supply (Option<u32>) = 1 byte option flag + optional 4 bytes
            const hasMaxSupply = data.readUInt8(offset); offset += 1;
            if (hasMaxSupply) offset += 4;
            // supply (u32)
            offset += 4;
            // collection (Pubkey = 32 bytes)
            collection = new PublicKey(data.subarray(offset, offset + 32));
        } catch (parseError) {
            console.error(`[Achievements] Failed to parse achievement type ${achievementId}:`, parseError);
            return NextResponse.json(
                { error: 'Failed to read achievement type from chain' },
                { status: 500 }
            );
        }

        const txBuilder = new TransactionBuilder({
            connection,
            backendSigner,
            programId: PROGRAM_ID,
            xpMint: XP_MINT,
        });

        const result = await txBuilder.awardAchievement(achievementId, learner, collection);

        // Store in DB
        await prisma.achievements.upsert({
            where: {
                user_id_achievement_id: {
                    user_id: session.user.id,
                    achievement_id: achievementId,
                },
            },
            update: {
                tx_hash: result.signature,
            },
            create: {
                user_id: session.user.id,
                achievement_id: achievementId,
                tx_hash: result.signature,
            },
        });

        return NextResponse.json({
            awarded: true,
            achievementId,
            name: definition.name,
            xpReward: definition.xpReward,
            signature: result.signature,
            badge: definition.badge,
        });
    } catch (error) {
        console.error('[Achievements] Error awarding achievement:', error);

        // Handle specific on-chain errors
        const message = error instanceof Error ? error.message : '';
        if (message.includes('AchievementAlreadyAwarded')) {
            return NextResponse.json(
                { error: 'Achievement already awarded on-chain' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to award achievement', details: safeErrorDetails(error) },
            { status: 500 }
        );
    }
}
