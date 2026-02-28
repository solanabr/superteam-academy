import { type NextRequest, NextResponse } from "next/server";
import {
	getAcademyClient,
	getSolanaConnection,
	arweaveTxIdToBytes,
	getProgramId,
} from "@/lib/academy";
import { Transaction } from "@solana/web3.js";
import { buildUpdateCourseInstruction, type CourseAccount } from "@superteam-academy/anchor";
import { courseFields, moduleFields, lessonFields } from "@superteam-academy/cms/queries";
import {
	requireAdmin,
	sanityReadClient,
	sanityWriteClient,
	loadBackendSigner,
} from "@/lib/route-utils";

type RouteParams = { params: Promise<{ courseId: string }> };

function difficultyToLevel(d: number): string {
	return d >= 3 ? "advanced" : d === 2 ? "intermediate" : "beginner";
}

/** Resolve a course from on-chain by trying direct lookup, then slug from CMS. */
async function resolveOnchainCourse(
	courseId: string,
	cmsSlug?: string | null
): Promise<CourseAccount | null> {
	const client = getAcademyClient();
	const candidates = [...new Set([courseId, cmsSlug].filter(Boolean) as string[])];
	for (const id of candidates) {
		const course = await client.fetchCourse(id).catch(() => null);
		if (course) return course;
	}
	return null;
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
	const { courseId } = await params;
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	type CmsCourse = {
		_id: string;
		title?: string;
		slug?: { current?: string };
		description?: string;
		level?: string;
		duration?: string;
		xpReward?: number;
		track?: string;
		published?: boolean;
		onchainStatus?: string;
		modules?: Array<{
			_id: string;
			title: string;
			slug?: { current: string };
			description?: string;
			order: number;
			lessons?: Array<{
				_id: string;
				title: string;
				slug?: { current: string };
				xpReward: number;
				duration?: string;
				order: number;
			}>;
		}>;
	};

	const cmsCourse = sanityReadClient
		? await sanityReadClient
				.fetch<CmsCourse | null>(
					`*[_type == "course" && (_id == $courseId || slug.current == $courseId)][0] {
				${courseFields},
				"modules": *[_type == "module" && references(^._id)] | order(order asc) {
					${moduleFields},
					"lessons": *[_type == "lesson" && references(^._id)] | order(order asc) { ${lessonFields} }
				}
			}`,
					{ courseId }
				)
				.catch(() => null)
		: null;

	const onchain = await resolveOnchainCourse(courseId, cmsCourse?.slug?.current);

	if (!cmsCourse && !onchain) {
		return NextResponse.json({ error: "Course not found" }, { status: 404 });
	}

	const id = onchain?.courseId ?? cmsCourse?.slug?.current ?? courseId;
	const lessonCount = onchain?.lessonCount ?? 0;

	return NextResponse.json({
		course: {
			_id: cmsCourse?._id ?? id,
			title: cmsCourse?.title ?? id,
			slug: { current: id },
			description: cmsCourse?.description ?? "",
			level:
				cmsCourse?.level ?? (onchain ? difficultyToLevel(onchain.difficulty) : "beginner"),
			duration: cmsCourse?.duration ?? `${Math.max(lessonCount, 1) * 10} min`,
			xpReward: onchain ? onchain.xpPerLesson * lessonCount : (cmsCourse?.xpReward ?? 0),
			track: cmsCourse?.track ?? "",
			published: onchain?.isActive ?? Boolean(cmsCourse?.published),
			onchainStatus: onchain ? "succeeded" : (cmsCourse?.onchainStatus ?? "draft"),
			modules: cmsCourse?.modules ?? [],
		},
	});
}

/** Send on-chain update_course if any relevant field changed. Returns signature or null. */
async function sendOnchainUpdate(params: {
	courseId: string;
	onchain: CourseAccount;
	wantActive: boolean | null;
	wantXpPerLesson: number | null;
	wantContentTxId: number[] | null;
}): Promise<{ signature: string | null; changed: boolean }> {
	const activeChanged =
		params.wantActive !== null && params.wantActive !== params.onchain.isActive;
	const xpChanged =
		params.wantXpPerLesson !== null && params.wantXpPerLesson !== params.onchain.xpPerLesson;
	const contentChanged = params.wantContentTxId !== null;

	if (!activeChanged && !xpChanged && !contentChanged) {
		return { signature: null, changed: false };
	}

	const programId = getProgramId();
	const connection = getSolanaConnection();
	const authority = loadBackendSigner();

	const ix = buildUpdateCourseInstruction({
		courseId: params.courseId,
		newContentTxId: contentChanged ? params.wantContentTxId : null,
		newIsActive: activeChanged ? params.wantActive : null,
		newXpPerLesson: xpChanged ? params.wantXpPerLesson : null,
		authority: authority.publicKey,
		programId,
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
	return { signature, changed: true };
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const { courseId } = await params;
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	const body = (await request.json()) as Record<string, unknown>;
	const ALLOWED = [
		"title",
		"description",
		"level",
		"duration",
		"xpReward",
		"track",
		"published",
	] as const;
	const patch: Record<string, unknown> = {};
	for (const key of ALLOWED) {
		if (key in body) patch[key] = body[key];
	}

	// Resolve current CMS doc and on-chain state
	const cmsCurrent = sanityWriteClient
		? await sanityWriteClient
				.fetch<{
					_id: string;
					title?: string;
					description?: string;
					slug?: { current?: string };
					level?: string;
					duration?: string;
					xpReward?: number;
					track?: string;
					published?: boolean;
					onchainStatus?: string;
				} | null>(
					`*[_type == "course" && (_id == $id || slug.current == $id)][0]{
				_id, title, description, slug, level, duration, xpReward, track, published, onchainStatus
			}`,
					{ id: courseId }
				)
				.catch(() => null)
		: null;

	const onchain = await resolveOnchainCourse(courseId, cmsCurrent?.slug?.current);
	if (!onchain) {
		return NextResponse.json(
			{ error: "Course not found on-chain. Refusing CMS-only update." },
			{ status: 404 }
		);
	}

	const onchainCourseId = onchain.courseId;
	const lessonCount = Math.max(onchain.lessonCount, 1);

	// Compute on-chain deltas — only send values that actually changed
	const wantActive = typeof patch.published === "boolean" ? (patch.published as boolean) : null;
	const wantXpTotal =
		typeof patch.xpReward === "number" ? Math.max(0, Math.floor(Number(patch.xpReward))) : null;
	const wantXpPerLesson =
		wantXpTotal !== null ? Math.max(0, Math.round(wantXpTotal / lessonCount)) : null;
	const wantContentTxId =
		typeof body.arweaveTxId === "string"
			? arweaveTxIdToBytes(body.arweaveTxId as string)
			: null;

	let onchainResult: { signature: string | null; changed: boolean };
	try {
		onchainResult = await sendOnchainUpdate({
			courseId: onchainCourseId,
			onchain,
			wantActive,
			wantXpPerLesson,
			wantContentTxId,
		});
	} catch (error) {
		return NextResponse.json(
			{
				error: "On-chain update failed",
				onchain: {
					synced: false,
					error: error instanceof Error ? error.message : "Unknown",
				},
			},
			{ status: 502 }
		);
	}

	const onchainSignature = onchainResult.signature;
	const hasOnchainDelta = onchainResult.changed;

	// Re-fetch on-chain state after update
	const updatedOnchain = hasOnchainDelta
		? await getAcademyClient()
				.fetchCourse(onchainCourseId)
				.catch(() => onchain)
		: onchain;

	// Write CMS index
	const client = sanityWriteClient;
	if (!client) {
		return NextResponse.json({
			onchain: {
				synced: Boolean(onchainSignature) || !hasOnchainDelta,
				...(onchainSignature ? { signature: onchainSignature } : {}),
			},
			warning: "On-chain update succeeded but Sanity write token is missing.",
		});
	}

	const effectivePublished = updatedOnchain?.isActive ?? Boolean(cmsCurrent?.published);
	const effectiveXpReward = (updatedOnchain?.xpPerLesson ?? 0) * lessonCount;

	const sanityDoc = {
		_type: "course",
		title:
			typeof patch.title === "string" ? patch.title : (cmsCurrent?.title ?? onchainCourseId),
		description:
			typeof patch.description === "string"
				? patch.description
				: (cmsCurrent?.description ?? ""),
		slug: { _type: "slug" as const, current: onchainCourseId },
		level:
			typeof patch.level === "string"
				? patch.level
				: (cmsCurrent?.level ?? difficultyToLevel(onchain.difficulty)),
		duration:
			typeof patch.duration === "string"
				? patch.duration
				: (cmsCurrent?.duration ?? `${lessonCount * 10} min`),
		xpReward: effectiveXpReward,
		track: typeof patch.track === "string" ? patch.track : (cmsCurrent?.track ?? ""),
		published: effectivePublished,
		onchainStatus: "succeeded",
		...(onchainSignature ? { updateSignature: onchainSignature } : {}),
	};

	try {
		const updated = cmsCurrent?._id
			? await client.patch(cmsCurrent._id).set(sanityDoc).commit()
			: await client.create(sanityDoc);
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
				onchain: { synced: true, signature: onchainSignature },
				warning: "On-chain succeeded but Sanity update failed. Reconcile later.",
				error: error instanceof Error ? error.message : "Sanity patch failed",
			});
		}
		throw error;
	}
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
	const { courseId } = await params;
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	const programId = getProgramId();
	const connection = getSolanaConnection();
	const authority = loadBackendSigner();
	const client = sanityWriteClient;

	// Resolve the slug for PDA derivation
	let courseDocId: string | null = null;
	let courseSlug = courseId;
	if (client) {
		const existing = await client.fetch<{ _id: string; slug?: { current?: string } } | null>(
			`*[_type == "course" && (_id == $id || slug.current == $id)][0]{ _id, slug }`,
			{ id: courseId }
		);
		if (existing) {
			courseDocId = existing._id;
			courseSlug = existing.slug?.current ?? courseId;
		}
	}

	// Deactivate on-chain
	const onchain = await getAcademyClient()
		.fetchCourse(courseSlug)
		.catch(() => null);
	let deactivateSignature: string | null = null;

	if (onchain) {
		const ix = buildUpdateCourseInstruction({
			courseId: courseSlug,
			newIsActive: false,
			authority: authority.publicKey,
			programId,
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
				deactivated: Boolean(onchain),
				...(deactivateSignature ? { signature: deactivateSignature } : {}),
			},
			warning: "Sanity write token not configured.",
		});
	}

	// Delete CMS modules → lessons → course
	if (courseDocId) {
		const modules = await client.fetch<Array<{ _id: string }>>(
			`*[_type == "module" && references($courseId)]{ _id }`,
			{ courseId: courseDocId }
		);
		for (const mod of modules) {
			const lessons = await client.fetch<Array<{ _id: string }>>(
				`*[_type == "lesson" && references($moduleId)]{ _id }`,
				{ moduleId: mod._id }
			);
			for (const lesson of lessons) await client.delete(lesson._id);
			await client.delete(mod._id);
		}
		await client.delete(courseDocId);
	}

	return NextResponse.json({
		success: true,
		onchain: {
			deactivated: Boolean(onchain),
			...(deactivateSignature ? { signature: deactivateSignature } : {}),
		},
	});
}
