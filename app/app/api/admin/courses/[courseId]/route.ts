import { type NextRequest, NextResponse } from "next/server";
import { getSolanaConnection, arweaveTxIdToBytes, getProgramId } from "@/lib/academy";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { courseFields, moduleFields, lessonFields } from "@superteam-academy/cms/queries";
import {
	requireAdmin,
	sanityReadClient,
	sanityWriteClient,
	loadBackendSigner,
	instructionDiscriminator,
	encodeOptionBytes,
	encodeOptionBool,
	encodeOptionU32,
	encodeOptionU16,
} from "@/lib/route-utils";

type RouteParams = { params: Promise<{ courseId: string }> };

async function sendOnchainCourseUpdate(params: {
	onchainCourseId: string;
	newIsActive: boolean | null;
	newXpPerLesson: number | null;
	newContentTxId: string | null;
}): Promise<string | null> {
	const hasAnyChange =
		params.newIsActive !== null ||
		params.newXpPerLesson !== null ||
		params.newContentTxId !== null;
	if (!hasAnyChange) return null;

	const programId = getProgramId();
	const connection = getSolanaConnection();
	const authority = loadBackendSigner();

	const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], programId);
	const [coursePda] = PublicKey.findProgramAddressSync(
		[Buffer.from("course"), Buffer.from(params.onchainCourseId)],
		programId
	);

	const configInfo = await connection.getAccountInfo(configPda, "confirmed");
	if (!configInfo) {
		throw new Error("On-chain config account is missing");
	}
	const configAuthority = new PublicKey(configInfo.data.subarray(8, 40));
	if (!configAuthority.equals(authority.publicKey)) {
		throw new Error("Configured signer is not on-chain authority for update_course");
	}

	const newContentTxIdBytes = params.newContentTxId
		? arweaveTxIdToBytes(params.newContentTxId)
		: null;

	const data = Buffer.concat([
		instructionDiscriminator("update_course"),
		encodeOptionBytes(newContentTxIdBytes),
		encodeOptionBool(params.newIsActive),
		encodeOptionU32(params.newXpPerLesson),
		encodeOptionU32(null),
		encodeOptionU16(null),
	]);

	const ix = new TransactionInstruction({
		programId,
		keys: [
			{ pubkey: configPda, isSigner: false, isWritable: false },
			{ pubkey: coursePda, isSigner: false, isWritable: true },
			{ pubkey: authority.publicKey, isSigner: true, isWritable: false },
		],
		data,
	});

	const tx = new Transaction().add(ix);
	tx.feePayer = authority.publicKey;
	const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
	tx.recentBlockhash = blockhash;
	tx.sign(authority);

	const signature = await connection.sendRawTransaction(tx.serialize());
	await connection.confirmTransaction(
		{ signature, blockhash, lastValidBlockHeight },
		"confirmed"
	);
	return signature;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
	const { courseId } = await params;
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	const client = sanityReadClient;
	if (!client) {
		return NextResponse.json({ error: "Sanity not configured" }, { status: 500 });
	}

	const course = await client.fetch(
		`*[_type == "course" && (_id == $courseId || slug.current == $courseId)][0] {
			${courseFields},
			"modules": *[_type == "module" && references(^._id)] | order(order asc) {
				${moduleFields},
				"lessons": *[_type == "lesson" && references(^._id)] | order(order asc) {
					${lessonFields}
				}
			}
		}`,
		{ courseId }
	);

	if (!course) {
		return NextResponse.json({ error: "Course not found" }, { status: 404 });
	}

	return NextResponse.json({ course });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const { courseId } = await params;
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	const client = sanityWriteClient;
	if (!client) {
		return NextResponse.json({ error: "Sanity write token not configured" }, { status: 500 });
	}

	const body = (await request.json()) as Record<string, unknown>;
	const allowedFields = [
		"title",
		"description",
		"level",
		"duration",
		"xpReward",
		"track",
		"published",
	];
	const patch: Record<string, unknown> = {};

	for (const key of allowedFields) {
		if (key in body) {
			patch[key] = body[key];
		}
	}

	if (patch.title && typeof patch.title === "string") {
		patch.slug = {
			_type: "slug",
			current: (patch.title as string)
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, ""),
		};
	}

	const current = await client.fetch<{
		_id: string;
		slug?: { current?: string };
		onchainStatus?: string;
		arweaveTxId?: string;
		xpReward?: number;
		published?: boolean;
	} | null>(
		`*[_type == "course" && _id == $id][0]{ _id, slug, onchainStatus, arweaveTxId, xpReward, published }`,
		{ id: courseId }
	);

	if (!current) {
		return NextResponse.json({ error: "Course not found" }, { status: 404 });
	}

	let onchainSignature: string | null = null;
	let onchainError: string | null = null;
	const shouldTreatAsOnchainSource =
		current.onchainStatus === "succeeded" && !!current.slug?.current;
	const onchainCourseId = current.slug?.current ?? null;
	const hasOnchainFieldUpdates =
		typeof patch.published === "boolean" ||
		typeof patch.xpReward === "number" ||
		typeof body.arweaveTxId === "string";

	if (shouldTreatAsOnchainSource && onchainCourseId && hasOnchainFieldUpdates) {
		try {
			onchainSignature = await sendOnchainCourseUpdate({
				onchainCourseId,
				newIsActive:
					typeof patch.published === "boolean" ? (patch.published as boolean) : null,
				newXpPerLesson: typeof patch.xpReward === "number" ? Number(patch.xpReward) : null,
				newContentTxId:
					typeof body.arweaveTxId === "string" ? (body.arweaveTxId as string) : null,
			});
		} catch (error) {
			onchainError = error instanceof Error ? error.message : "Failed to update on-chain";
			return NextResponse.json(
				{
					error: "On-chain update failed. Sanity update was not applied.",
					onchain: { synced: false, error: onchainError },
				},
				{ status: 502 }
			);
		}
	}

	try {
		const updated = await client
			.patch(courseId)
			.set({
				...patch,
				...(onchainSignature
					? { onchainStatus: "succeeded", updateSignature: onchainSignature }
					: {}),
			})
			.commit();

		return NextResponse.json({
			course: updated,
			onchain: {
				synced: Boolean(onchainSignature),
				...(onchainSignature ? { signature: onchainSignature } : {}),
			},
		});
	} catch (error) {
		if (onchainSignature) {
			return NextResponse.json({
				onchain: {
					synced: true,
					signature: onchainSignature,
				},
				warning:
					"On-chain update succeeded but Sanity indexing update failed. You can reconcile later.",
				error: error instanceof Error ? error.message : "Sanity patch failed",
			});
		}
		throw error;
	}
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
	const { courseId } = await params;
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	const client = sanityWriteClient;

	const programId = getProgramId();
	const connection = getSolanaConnection();
	const authority = loadBackendSigner();

	let courseSlug: string | null = null;
	if (client) {
		const existing = await client.fetch<{
			slug?: { current?: string };
			onchainStatus?: string;
		} | null>(`*[_type == "course" && _id == $id][0]{ slug, onchainStatus }`, { id: courseId });
		courseSlug = existing?.slug?.current ?? null;
	}

	if (!courseSlug) {
		// Fallback: when deletion was called by slug value instead of Sanity _id.
		courseSlug = courseId;
	}

	const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], programId);
	const [coursePda] = PublicKey.findProgramAddressSync(
		[Buffer.from("course"), Buffer.from(courseSlug)],
		programId
	);

	const [configInfo, onchainCourseInfo] = await Promise.all([
		connection.getAccountInfo(configPda, "confirmed"),
		connection.getAccountInfo(coursePda, "confirmed"),
	]);

	if (!configInfo) {
		return NextResponse.json(
			{ error: "On-chain config not found. Refusing to delete index first." },
			{ status: 502 }
		);
	}

	const configAuthority = new PublicKey(configInfo.data.subarray(8, 40));
	if (!configAuthority.equals(authority.publicKey)) {
		return NextResponse.json(
			{ error: "Configured signer is not on-chain authority for delete flow." },
			{ status: 403 }
		);
	}

	let deactivateSignature: string | null = null;
	if (onchainCourseInfo) {
		const ix = new TransactionInstruction({
			programId,
			keys: [
				{ pubkey: configPda, isSigner: false, isWritable: false },
				{ pubkey: coursePda, isSigner: false, isWritable: true },
				{ pubkey: authority.publicKey, isSigner: true, isWritable: false },
			],
			data: Buffer.concat([
				instructionDiscriminator("update_course"),
				Buffer.from([0]),
				Buffer.from([1, 0]),
				Buffer.from([0]),
				Buffer.from([0]),
				Buffer.from([0]),
			]),
		});

		const tx = new Transaction().add(ix);
		tx.feePayer = authority.publicKey;
		const { blockhash, lastValidBlockHeight } =
			await connection.getLatestBlockhash("confirmed");
		tx.recentBlockhash = blockhash;
		tx.sign(authority);

		deactivateSignature = await connection.sendRawTransaction(tx.serialize());
		await connection.confirmTransaction(
			{ signature: deactivateSignature, blockhash, lastValidBlockHeight },
			"confirmed"
		);
	}

	if (!client) {
		return NextResponse.json({
			success: true,
			onchain: {
				deactivated: Boolean(onchainCourseInfo),
				...(deactivateSignature ? { signature: deactivateSignature } : {}),
			},
			warning: "Sanity write token is not configured. On-chain state is authoritative.",
		});
	}

	// Delete related modules and lessons first
	const modules = await client.fetch<Array<{ _id: string }>>(
		`*[_type == "module" && references($courseId)]{ _id }`,
		{ courseId }
	);

	for (const mod of modules) {
		const lessons = await client.fetch<Array<{ _id: string }>>(
			`*[_type == "lesson" && references($moduleId)]{ _id }`,
			{ moduleId: mod._id }
		);
		for (const lesson of lessons) {
			await client.delete(lesson._id);
		}
		await client.delete(mod._id);
	}

	await client.delete(courseId);
	return NextResponse.json({
		success: true,
		onchain: {
			deactivated: Boolean(onchainCourseInfo),
			...(deactivateSignature ? { signature: deactivateSignature } : {}),
		},
	});
}
