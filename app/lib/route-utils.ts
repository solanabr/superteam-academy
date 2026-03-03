import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
	Keypair,
	PublicKey,
	SystemProgram,
	type Transaction,
	TransactionInstruction,
} from "@solana/web3.js";
import {
	findToken2022ATA,
	TOKEN_2022_PROGRAM_ID,
	ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@superteam-academy/solana";
import { serverAuth } from "@/lib/auth";
import { getLinkedWallet } from "@/lib/auth";
import { getSolanaConnection, getAcademyClient, getProgramId } from "@/lib/academy";
import { readClient, writeClient } from "@/lib/cms-context";
import { syncAuthSession } from "../app/api/auth/sync/action";
import type { UserRole } from "@/packages/cms/src";

type AuthResult =
	| { ok: true; session: NonNullable<Awaited<ReturnType<typeof serverAuth.api.getSession>>> }
	| { ok: false; response: NextResponse };

export async function requireSession(): Promise<AuthResult> {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });
	if (!session) {
		return {
			ok: false,
			response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
		};
	}
	return { ok: true, session };
}

export async function requireRole(...roles: UserRole[]): Promise<AuthResult> {
	const auth = await requireSession();
	if (!auth.ok) return auth;
	const synced = await syncAuthSession(auth.session);
	if (!synced?.role || !roles.includes(synced.role)) {
		return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
	}
	return auth;
}

export function requireAdmin(): Promise<AuthResult> {
	return requireRole("admin", "superadmin");
}

export { readClient as sanityReadClient, writeClient as sanityWriteClient };

export function loadBackendSigner(): Keypair {
	const secret = process.env.BACKEND_SIGNER_SECRET_KEY;
	if (!secret) throw new Error("BACKEND_SIGNER_SECRET_KEY is required");
	return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
}

export function encodeBorshString(value: string): Buffer {
	const bytes = Buffer.from(value, "utf8");
	const len = Buffer.alloc(4);
	len.writeUInt32LE(bytes.length, 0);
	return Buffer.concat([len, bytes]);
}

export function encodeOptionBytes(bytes: number[] | Uint8Array | null): Buffer {
	if (!bytes) return Buffer.from([0]);
	return Buffer.concat([Buffer.from([1]), Buffer.from(bytes)]);
}

export function encodeOptionBool(value: boolean | null): Buffer {
	if (value === null) return Buffer.from([0]);
	return Buffer.from([1, value ? 1 : 0]);
}

export function encodeOptionU32(value: number | null): Buffer {
	if (value === null) return Buffer.from([0]);
	const raw = Buffer.alloc(4);
	raw.writeUInt32LE(value, 0);
	return Buffer.concat([Buffer.from([1]), raw]);
}

export function encodeOptionU16(value: number | null): Buffer {
	if (value === null) return Buffer.from([0]);
	const raw = Buffer.alloc(2);
	raw.writeUInt16LE(value, 0);
	return Buffer.concat([Buffer.from([1]), raw]);
}

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 10_000;
export const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 50;

export function parseTags(tags: unknown): string[] {
	if (!Array.isArray(tags)) return [];
	return tags
		.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
		.map((t) => t.trim().slice(0, MAX_TAG_LENGTH));
}

function parseJsonBody(body: unknown): Record<string, unknown> | null {
	if (!body || typeof body !== "object") return null;
	return body as Record<string, unknown>;
}

type ParseBodyResult =
	| { ok: true; data: Record<string, unknown> }
	| { ok: false; response: NextResponse };

export async function safeParseBody(request: Request): Promise<ParseBodyResult> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return {
			ok: false,
			response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
		};
	}
	const data = parseJsonBody(body);
	if (!data) {
		return {
			ok: false,
			response: NextResponse.json({ error: "Invalid payload" }, { status: 400 }),
		};
	}
	return { ok: true, data };
}

type WalletResult =
	| { ok: true; wallet: string; learner: PublicKey }
	| { ok: false; response: NextResponse };

export async function requireWallet(): Promise<WalletResult> {
	const wallet = await getLinkedWallet();
	if (!wallet) {
		return {
			ok: false,
			response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
		};
	}
	return { ok: true, wallet, learner: new PublicKey(wallet) };
}

type OnchainRouteInit =
	| {
			ok: true;
			learner: PublicKey;
			client: ReturnType<typeof getAcademyClient>;
			programId: PublicKey;
			backendKeypair: Keypair;
	  }
	| { ok: false; response: NextResponse };

export async function initOnchainRoute(): Promise<OnchainRouteInit> {
	const walletResult = await requireWallet();
	if (!walletResult.ok) return walletResult;
	return {
		ok: true,
		learner: walletResult.learner,
		client: getAcademyClient(),
		programId: getProgramId(),
		backendKeypair: loadBackendSigner(),
	};
}

interface SignAndSendOptions {
	signers?: Keypair[];
}

export async function signAndSendTransaction(
	tx: Transaction,
	payer: Keypair,
	options?: SignAndSendOptions
): Promise<string> {
	const connection = getSolanaConnection();
	const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
	tx.recentBlockhash = blockhash;
	tx.feePayer = payer.publicKey;

	const allSigners = [payer, ...(options?.signers ?? [])];
	tx.sign(...allSigners);

	const signature = await connection.sendRawTransaction(tx.serialize());
	await connection.confirmTransaction(
		{ signature, blockhash, lastValidBlockHeight },
		"confirmed"
	);
	return signature;
}

export async function ensureToken2022ATA(
	tx: Transaction,
	owner: PublicKey,
	mint: PublicKey,
	payer: Keypair
): Promise<PublicKey> {
	const connection = getSolanaConnection();
	const ata = findToken2022ATA(owner, mint);
	const ataInfo = await connection.getAccountInfo(ata);
	if (!ataInfo) {
		tx.add(
			new TransactionInstruction({
				programId: ASSOCIATED_TOKEN_PROGRAM_ID,
				keys: [
					{ pubkey: payer.publicKey, isSigner: true, isWritable: true },
					{ pubkey: ata, isSigner: false, isWritable: true },
					{ pubkey: owner, isSigner: false, isWritable: false },
					{ pubkey: mint, isSigner: false, isWritable: false },
					{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
					{ pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
				],
				data: Buffer.from([1]),
			})
		);
	}
	return ata;
}
