import { NextResponse } from "next/server";
import {
	Keypair,
	PublicKey,
	SystemProgram,
	Transaction,
	TransactionInstruction,
} from "@solana/web3.js";
import { buildAwardAchievementInstruction } from "@superteam-academy/anchor";
import {
	findToken2022ATA,
	TOKEN_2022_PROGRAM_ID,
	ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@superteam-academy/solana";
import { getLinkedWallet } from "@/lib/auth";
import { getAcademyClient, getProgramId, getSolanaConnection } from "@/lib/academy";

function loadBackendSigner(): Keypair {
	const secret = process.env.BACKEND_SIGNER_SECRET_KEY;
	if (!secret) throw new Error("BACKEND_SIGNER_SECRET_KEY is required");
	return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
}

export async function POST(request: Request) {
	try {
		const wallet = await getLinkedWallet();
		if (!wallet) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const body = await request.json();
		const { achievementId } = body as { achievementId?: string };
		if (!achievementId) {
			return NextResponse.json({ error: "achievementId is required" }, { status: 400 });
		}

		const connection = getSolanaConnection();
		const client = getAcademyClient();
		const programId = getProgramId();
		const backendKeypair = loadBackendSigner();
		const recipient = new PublicKey(wallet);

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

		// Check if already earned
		const existingReceipt = await client.fetchAchievementReceipt(achievementId, recipient);
		if (existingReceipt) {
			return NextResponse.json({ error: "Achievement already earned" }, { status: 409 });
		}

		// Check max supply
		if (
			achievementType.maxSupply > 0 &&
			achievementType.currentSupply >= achievementType.maxSupply
		) {
			return NextResponse.json({ error: "Achievement supply exhausted" }, { status: 410 });
		}

		const xpMint = config.xpMint;
		const recipientTokenAccount = findToken2022ATA(recipient, xpMint);
		const assetKeypair = Keypair.generate();

		const tx = new Transaction();

		// Ensure the recipient's Token-2022 ATA exists
		const ataInfo = await connection.getAccountInfo(recipientTokenAccount);
		if (!ataInfo) {
			const createAtaIx = new TransactionInstruction({
				programId: ASSOCIATED_TOKEN_PROGRAM_ID,
				keys: [
					{ pubkey: backendKeypair.publicKey, isSigner: true, isWritable: true },
					{ pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
					{ pubkey: recipient, isSigner: false, isWritable: false },
					{ pubkey: xpMint, isSigner: false, isWritable: false },
					{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
					{ pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
				],
				data: Buffer.from([1]), // CreateIdempotent
			});
			tx.add(createAtaIx);
		}

		const ix = buildAwardAchievementInstruction({
			achievementId,
			recipient,
			asset: assetKeypair.publicKey,
			collection: achievementType.collection,
			recipientTokenAccount,
			xpMint,
			payer: backendKeypair.publicKey,
			minter: backendKeypair.publicKey,
			programId,
		});

		tx.add(ix);
		tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
		tx.feePayer = backendKeypair.publicKey;
		tx.sign(backendKeypair, assetKeypair);

		const signature = await connection.sendRawTransaction(tx.serialize());
		await connection.confirmTransaction(signature, "confirmed");

		return NextResponse.json({
			signature,
			asset: assetKeypair.publicKey.toBase58(),
		});
	} catch (error) {
		console.error("award_achievement error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
