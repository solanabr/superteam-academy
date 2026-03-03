import { NextResponse } from "next/server";
import { Keypair, Transaction } from "@solana/web3.js";
import { buildAwardAchievementInstruction } from "@superteam-academy/anchor";
import { initOnchainRoute, signAndSendTransaction, ensureToken2022ATA } from "@/lib/route-utils";

export async function POST(request: Request) {
	try {
		const init = await initOnchainRoute();
		if (!init.ok) return init.response;
		const { learner: recipient, client, programId, backendKeypair } = init;

		const body = await request.json();
		const { achievementId } = body as { achievementId?: string };
		if (!achievementId) {
			return NextResponse.json({ error: "achievementId is required" }, { status: 400 });
		}

		const [config, achievementType] = await Promise.all([
			client.fetchConfig(),
			client.fetchAchievementType(achievementId),
		]);

		if (!config) {
			return NextResponse.json({ error: "Config not found" }, { status: 500 });
		}
		if (!achievementType || !achievementType.isActive) {
			return NextResponse.json(
				{ error: "Achievement not found or inactive" },
				{ status: 404 }
			);
		}

		const existingReceipt = await client.fetchAchievementReceipt(achievementId, recipient);
		if (existingReceipt) {
			return NextResponse.json({ error: "Achievement already earned" }, { status: 409 });
		}

		if (
			achievementType.maxSupply > 0 &&
			achievementType.currentSupply >= achievementType.maxSupply
		) {
			return NextResponse.json({ error: "Achievement supply exhausted" }, { status: 410 });
		}

		const tx = new Transaction();
		const recipientTokenAccount = await ensureToken2022ATA(
			tx,
			recipient,
			config.xpMint,
			backendKeypair
		);

		const assetKeypair = Keypair.generate();
		const ix = buildAwardAchievementInstruction({
			achievementId,
			recipient,
			asset: assetKeypair.publicKey,
			collection: achievementType.collection,
			recipientTokenAccount,
			xpMint: config.xpMint,
			payer: backendKeypair.publicKey,
			minter: backendKeypair.publicKey,
			programId,
		});

		tx.add(ix);
		const signature = await signAndSendTransaction(tx, backendKeypair, {
			signers: [assetKeypair],
		});

		return NextResponse.json({
			signature,
			asset: assetKeypair.publicKey.toBase58(),
		});
	} catch (error) {
		console.error("award_achievement error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
