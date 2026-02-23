import { NextResponse } from "next/server";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
	buildIssueCredentialInstruction,
	buildUpgradeCredentialInstruction,
} from "@superteam-academy/anchor";
import { getLinkedWallet } from "@/lib/auth";
import { getAcademyClient, getProgramId, getSolanaConnection } from "@/lib/academy";

function loadBackendSigner(): Keypair {
	const secret = process.env.BACKEND_SIGNER_SECRET_KEY;
	if (!secret) throw new Error("BACKEND_SIGNER_SECRET_KEY is required");
	return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
}

interface IssueBody {
	courseId?: string;
	trackCollection?: string;
	credentialName?: string;
	metadataUri?: string;
	coursesCompleted?: number;
	totalXp?: string;
	existingCredentialAsset?: string;
}

export async function POST(request: Request) {
	try {
		const wallet = await getLinkedWallet();
		if (!wallet) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const body = (await request.json()) as IssueBody;
		const {
			courseId,
			trackCollection,
			credentialName,
			metadataUri,
			coursesCompleted,
			totalXp,
		} = body;

		if (
			!courseId ||
			!trackCollection ||
			!credentialName ||
			!metadataUri ||
			coursesCompleted == null ||
			totalXp == null
		) {
			return NextResponse.json(
				{
					error: "courseId, trackCollection, credentialName, metadataUri, coursesCompleted, and totalXp are required",
				},
				{ status: 400 }
			);
		}

		const connection = getSolanaConnection();
		const client = getAcademyClient();
		const programId = getProgramId();
		const backendKeypair = loadBackendSigner();
		const learner = new PublicKey(wallet);
		const trackCollectionPk = new PublicKey(trackCollection);
		const totalXpBigInt = BigInt(totalXp);
		const isUpgrade = !!body.existingCredentialAsset;

		const enrollment = await client.fetchEnrollment(courseId, learner);
		if (!enrollment) {
			return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
		}
		if (!enrollment.completedAt) {
			return NextResponse.json({ error: "Course not yet finalized" }, { status: 400 });
		}
		if (!isUpgrade && enrollment.credentialAsset) {
			return NextResponse.json({ error: "Credential already issued" }, { status: 409 });
		}

		let credentialAssetKeypair: Keypair | null = null;
		let credentialAssetPk: PublicKey;

		if (isUpgrade) {
			credentialAssetPk = new PublicKey(body.existingCredentialAsset as string);
		} else {
			credentialAssetKeypair = Keypair.generate();
			credentialAssetPk = credentialAssetKeypair.publicKey;
		}

		const ix = isUpgrade
			? buildUpgradeCredentialInstruction({
					courseId,
					learner,
					credentialAsset: credentialAssetPk,
					trackCollection: trackCollectionPk,
					payer: backendKeypair.publicKey,
					backendSigner: backendKeypair.publicKey,
					credentialName,
					metadataUri,
					coursesCompleted,
					totalXp: totalXpBigInt,
					programId,
				})
			: buildIssueCredentialInstruction({
					courseId,
					learner,
					credentialAsset: credentialAssetPk,
					trackCollection: trackCollectionPk,
					payer: backendKeypair.publicKey,
					backendSigner: backendKeypair.publicKey,
					credentialName,
					metadataUri,
					coursesCompleted,
					totalXp: totalXpBigInt,
					programId,
				});

		const tx = new Transaction().add(ix);
		tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
		tx.feePayer = backendKeypair.publicKey;

		const signers = [backendKeypair];
		if (credentialAssetKeypair) {
			signers.push(credentialAssetKeypair);
		}
		tx.sign(...signers);

		const signature = await connection.sendRawTransaction(tx.serialize());
		await connection.confirmTransaction(signature, "confirmed");

		return NextResponse.json({
			signature,
			credentialAsset: credentialAssetPk.toBase58(),
		});
	} catch (error) {
		console.error("credential issue/upgrade error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
