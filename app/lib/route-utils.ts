import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Keypair } from "@solana/web3.js";
import { createHash } from "node:crypto";
import { serverAuth } from "@/lib/auth";
import { readClient, writeClient } from "@/lib/cms-context";
import { syncAuthSession } from "../app/api/auth/sync/action";

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

export async function requireAdmin(): Promise<AuthResult> {
	const auth = await requireSession();
	if (!auth.ok) return auth;
	const admin = await syncAuthSession(auth.session);
	if (admin?.role !== "admin" && admin?.role !== "superadmin") {
		return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
	}
	return auth;
}

export async function requireSuperAdmin(): Promise<AuthResult> {
	const auth = await requireSession();
	if (!auth.ok) return auth;
	const superAdmin = await syncAuthSession(auth.session);
	if (superAdmin?.role !== "superadmin") {
		return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
	}
	return auth;
}

export { readClient as sanityReadClient, writeClient as sanityWriteClient };

export function loadBackendSigner(): Keypair {
	const secret = process.env.BACKEND_SIGNER_SECRET_KEY;
	if (!secret) throw new Error("BACKEND_SIGNER_SECRET_KEY is required");
	return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
}

export function instructionDiscriminator(name: string): Buffer {
	return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
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
export const MAX_TAG_LENGTH = 50;

export function parseTags(tags: unknown): string[] {
	if (!Array.isArray(tags)) return [];
	return tags
		.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
		.map((t) => t.trim().slice(0, MAX_TAG_LENGTH));
}

export function parseJsonBody(body: unknown): Record<string, unknown> | null {
	if (!body || typeof body !== "object") return null;
	return body as Record<string, unknown>;
}
