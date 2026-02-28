import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/sanity-users";
import { createSanityClient } from "@superteam-academy/cms";
import { PROGRAM_ID as DEFAULT_PROGRAM_ID } from "@superteam-academy/anchor";
import { getSolanaConnection } from "@/lib/academy";
import { Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { courseFields } from "@superteam-academy/cms/queries";

function sanityWriteClient() {
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_WRITE_TOKEN;
	if (!projectId || !token) return null;
	return createSanityClient({ projectId, dataset, token, useCdn: false });
}

function sanityReadClient() {
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_READ_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN;
	if (!projectId || !token) return null;
	return createSanityClient({ projectId, dataset, token, useCdn: false });
}

function getProgramId(): PublicKey {
	const value =
		process.env.ACADEMY_PROGRAM_ID ??
		process.env.NEXT_PUBLIC_ACADEMY_PROGRAM_ID ??
		DEFAULT_PROGRAM_ID;
	return new PublicKey(value);
}

function loadAuthoritySigner(): Keypair {
	const secret = process.env.BACKEND_SIGNER_SECRET_KEY;
	if (!secret) {
		throw new Error("BACKEND_SIGNER_SECRET_KEY is required for on-chain course creation");
	}
	return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
}

function instructionDiscriminator(name: string): Buffer {
	return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

function encodeBorshString(value: string): Buffer {
	const bytes = Buffer.from(value, "utf8");
	const len = Buffer.alloc(4);
	len.writeUInt32LE(bytes.length, 0);
	return Buffer.concat([len, bytes]);
}

function encodeCreateCourseParams(params: {
	courseId: string;
	creator: PublicKey;
	contentTxId: number[];
	lessonCount: number;
	difficulty: number;
	xpPerLesson: number;
	trackId: number;
	trackLevel: number;
	prerequisite: PublicKey | null;
	creatorRewardXp: number;
	minCompletionsForReward: number;
}): Buffer {
	const prerequisite = params.prerequisite
		? Buffer.concat([Buffer.from([1]), params.prerequisite.toBuffer()])
		: Buffer.from([0]);

	const xpPerLesson = Buffer.alloc(4);
	xpPerLesson.writeUInt32LE(params.xpPerLesson, 0);
	const trackId = Buffer.alloc(2);
	trackId.writeUInt16LE(params.trackId, 0);
	const creatorRewardXp = Buffer.alloc(4);
	creatorRewardXp.writeUInt32LE(params.creatorRewardXp, 0);
	const minCompletions = Buffer.alloc(2);
	minCompletions.writeUInt16LE(params.minCompletionsForReward, 0);

	return Buffer.concat([
		instructionDiscriminator("create_course"),
		encodeBorshString(params.courseId),
		params.creator.toBuffer(),
		Buffer.from(params.contentTxId),
		Buffer.from([params.lessonCount]),
		Buffer.from([params.difficulty]),
		xpPerLesson,
		trackId,
		Buffer.from([params.trackLevel]),
		prerequisite,
		creatorRewardXp,
		minCompletions,
	]);
}

function encodeUpdateCourseInactive(): Buffer {
	const noneBytes = Buffer.from([0]); // Option<[u8;32]>
	const someFalse = Buffer.from([1, 0]); // Option<bool> = Some(false)
	const noneU32 = Buffer.from([0]); // Option<u32>
	const noneU16 = Buffer.from([0]); // Option<u16>
	return Buffer.concat([
		instructionDiscriminator("update_course"),
		noneBytes,
		someFalse,
		noneU32,
		noneU32,
		noneU16,
	]);
}

async function ensureCreateCourseOnchain(params: {
	courseId: string;
	lessonCount: number;
	xpPerLesson: number;
	difficulty: number;
	published: boolean;
}): Promise<{ signature: string | null; coursePda: string; alreadyExists: boolean }> {
	const programId = getProgramId();
	const connection = getSolanaConnection();
	const authority = loadAuthoritySigner();

	const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], programId);
	const [coursePda] = PublicKey.findProgramAddressSync(
		[Buffer.from("course"), Buffer.from(params.courseId)],
		programId
	);

	const [configInfo, existingCourseInfo] = await Promise.all([
		connection.getAccountInfo(configPda, "confirmed"),
		connection.getAccountInfo(coursePda, "confirmed"),
	]);

	if (!configInfo) throw new Error("On-chain config account is missing");
	const configAuthority = new PublicKey(configInfo.data.subarray(8, 40));
	if (!configAuthority.equals(authority.publicKey)) {
		throw new Error("Configured signer is not on-chain authority for create_course");
	}

	if (existingCourseInfo) {
		return { signature: null, coursePda: coursePda.toBase58(), alreadyExists: true };
	}

	const createIx = new TransactionInstruction({
		programId,
		keys: [
			{ pubkey: coursePda, isSigner: false, isWritable: true },
			{ pubkey: configPda, isSigner: false, isWritable: false },
			{ pubkey: authority.publicKey, isSigner: true, isWritable: true },
			{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
		],
		data: encodeCreateCourseParams({
			courseId: params.courseId,
			creator: authority.publicKey,
			contentTxId: new Array(32).fill(0),
			lessonCount: params.lessonCount,
			difficulty: params.difficulty,
			xpPerLesson: params.xpPerLesson,
			trackId: 1,
			trackLevel: 1,
			prerequisite: null,
			creatorRewardXp: 0,
			minCompletionsForReward: 1,
		}),
	});

	const tx = new Transaction().add(createIx);
	if (!params.published) {
		tx.add(
			new TransactionInstruction({
				programId,
				keys: [
					{ pubkey: configPda, isSigner: false, isWritable: false },
					{ pubkey: coursePda, isSigner: false, isWritable: true },
					{ pubkey: authority.publicKey, isSigner: true, isWritable: false },
				],
				data: encodeUpdateCourseInactive(),
			})
		);
	}

	tx.feePayer = authority.publicKey;
	const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
	tx.recentBlockhash = blockhash;
	tx.sign(authority);

	const signature = await connection.sendRawTransaction(tx.serialize());
	await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

	return { signature, coursePda: coursePda.toBase58(), alreadyExists: false };
}

function mapLevelToDifficulty(level: string): number {
	if (level === "advanced") return 3;
	if (level === "intermediate") return 2;
	return 1;
}

export async function GET() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id, session.user.email);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const client = sanityReadClient();
	if (!client) {
		return NextResponse.json({ error: "Sanity not configured" }, { status: 500 });
	}

	// Fetch ALL courses (including unpublished)
	const courses = await client.fetch(
		`*[_type == "course"] | order(_createdAt desc) {
			${courseFields},
			"moduleCount": count(*[_type == "module" && references(^._id)]),
			"lessonCount": count(*[_type == "lesson" && references(*[_type == "module" && references(^._id)][]._id)])
		}`
	);

	return NextResponse.json({ courses });
}

export async function POST(request: NextRequest) {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id, session.user.email);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const client = sanityWriteClient();

	const body = (await request.json()) as {
		title: string;
		description?: string;
		level: string;
		duration?: string;
		xpReward: number;
		track?: string;
		published?: boolean;
		modules?: Array<{
			title: string;
			description?: string;
			order: number;
			lessons: Array<{
				title: string;
				order: number;
				xpReward: number;
				duration?: string;
			}>;
		}>;
	};

	if (!body.title) {
		return NextResponse.json({ error: "Title is required" }, { status: 400 });
	}

	const slug = body.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

	const lessonCountFromModules =
		body.modules?.reduce((total, mod) => total + (mod.lessons?.length ?? 0), 0) ?? 0;
	const lessonCount = Math.max(1, Math.min(255, lessonCountFromModules || 1));
	const xpPerLesson = Math.max(0, Math.floor(Number(body.xpReward ?? 100)));
	const difficulty = mapLevelToDifficulty(body.level || "beginner");
	const published = body.published ?? false;

	let onchain:
		| { signature: string | null; coursePda: string; alreadyExists: boolean }
		| null = null;
	try {
		onchain = await ensureCreateCourseOnchain({
			courseId: slug,
			lessonCount,
			xpPerLesson,
			difficulty,
			published,
		});
	} catch (error) {
		return NextResponse.json(
			{
				error: "On-chain create failed. Sanity index was not written.",
				details: error instanceof Error ? error.message : "Unknown on-chain error",
			},
			{ status: 502 }
		);
	}

	if (!onchain) {
		return NextResponse.json(
			{ error: "On-chain create did not return a result" },
			{ status: 500 }
		);
	}

	if (!client) {
		return NextResponse.json(
			{
				onchain: {
					slug,
					coursePda: onchain.coursePda,
					created: !onchain.alreadyExists,
					...(onchain.signature ? { signature: onchain.signature } : {}),
				},
				warning: "On-chain course created, but Sanity write token is missing so index was not updated.",
			},
			{ status: 201 }
		);
	}

	// Create or update the Sanity index document after on-chain success.
	const existingBySlug = await client.fetch<{ _id: string } | null>(
		`*[_type == "course" && slug.current == $slug][0]{ _id }`,
		{ slug }
	);

	const courseDoc = {
		_type: "course",
		title: body.title,
		slug: { _type: "slug", current: slug },
		description: body.description ?? "",
		level: body.level || "beginner",
		duration: body.duration ?? "",
		xpReward: xpPerLesson,
		track: body.track ?? "",
		published,
		onchainStatus: "succeeded",
		coursePda: onchain.coursePda,
		...(onchain.signature ? { createSignature: onchain.signature } : {}),
	};

	const course = existingBySlug
		? await client.patch(existingBySlug._id).set(courseDoc).commit()
		: await client.create(courseDoc);

	// Create modules and lessons only once for new index docs.
	if (!existingBySlug && body.modules && body.modules.length > 0) {
		for (const mod of body.modules) {
			const moduleDoc = await client.create({
				_type: "module",
				title: mod.title,
				slug: {
					_type: "slug",
					current: mod.title
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "-")
						.replace(/^-|-$/g, ""),
				},
				description: mod.description ?? "",
				order: mod.order,
				course: { _ref: course._id },
			});

			for (const lesson of mod.lessons) {
				await client.create({
					_type: "lesson",
					title: lesson.title,
					slug: {
						_type: "slug",
						current: lesson.title
							.toLowerCase()
							.replace(/[^a-z0-9]+/g, "-")
							.replace(/^-|-$/g, ""),
					},
					order: lesson.order,
					xpReward: lesson.xpReward,
					duration: lesson.duration ?? "",
					module: { _ref: moduleDoc._id },
				});
			}
		}
	}

	return NextResponse.json(
		{
			course,
			onchain: {
				slug,
				coursePda: onchain.coursePda,
				created: !onchain.alreadyExists,
				...(onchain.signature ? { signature: onchain.signature } : {}),
			},
		},
		{ status: existingBySlug ? 200 : 201 }
	);
}
