import { type NextRequest, NextResponse } from "next/server";
import { getAcademyClient, getSolanaConnection, getProgramId } from "@/lib/academy";
import { Transaction } from "@solana/web3.js";
import {
	findCoursePDA,
	buildCreateCourseInstruction,
	buildUpdateCourseInstruction,
} from "@superteam-academy/anchor";
import { courseFields } from "@superteam-academy/cms/queries";
import {
	requireAdmin,
	sanityReadClient,
	sanityWriteClient,
	loadBackendSigner,
} from "@/lib/route-utils";

function difficultyToLevel(d: number): string {
	return d >= 3 ? "advanced" : d === 2 ? "intermediate" : "beginner";
}

function levelToDifficulty(l: string): number {
	return l === "advanced" ? 3 : l === "intermediate" ? 2 : 1;
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

// ─── GET: list courses (on-chain as source of truth, CMS for rich content) ──

export async function GET() {
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	const onchainCourses = await getAcademyClient().fetchAllCourses();

	// Fetch CMS metadata to enrich the on-chain listing
	type CmsRow = {
		_id: string;
		_createdAt: string;
		title?: string;
		slug?: { current?: string };
		level?: string;
		moduleCount?: number;
		lessonCount?: number;
	};
	let cmsMap = new Map<string, CmsRow>();
	if (sanityReadClient) {
		const rows = await sanityReadClient
			.fetch<CmsRow[]>(
				`*[_type == "course"] {
					${courseFields},
					"moduleCount": count(*[_type == "module" && references(^._id)]),
					"lessonCount": count(*[_type == "lesson" && references(*[_type == "module" && references(^._id)][]._id)])
				}`
			)
			.catch(() => [] as CmsRow[]);

		cmsMap = new Map(
			rows.flatMap((r) => {
				const id = r.slug?.current;
				return id ? [[id, r]] : [];
			})
		);
	}

	const courses = onchainCourses
		.map(({ account }) => {
			const cms = cmsMap.get(account.courseId);
			return {
				_id: cms?._id ?? account.courseId,
				_createdAt: cms?._createdAt ?? new Date(0).toISOString(),
				title: cms?.title ?? account.courseId,
				slug: { current: account.courseId },
				level: cms?.level ?? difficultyToLevel(account.difficulty),
				published: account.isActive,
				xpReward: account.xpPerLesson * account.lessonCount,
				onchainStatus: "succeeded" as const,
				moduleCount: cms?.moduleCount ?? 0,
				lessonCount: account.lessonCount,
			};
		})
		.sort((a, b) => b._createdAt.localeCompare(a._createdAt) || a.title.localeCompare(b.title));

	return NextResponse.json({ courses });
}

// ─── POST: create course (on-chain first, then CMS index) ───────────────────

export async function POST(request: NextRequest) {
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	const body = (await request.json()) as {
		title: string;
		description?: string;
		level?: string;
		duration?: string;
		xpReward?: number;
		track?: string;
		published?: boolean;
		modules?: Array<{
			title: string;
			description?: string;
			order: number;
			lessons: Array<{ title: string; order: number; xpReward: number; duration?: string }>;
		}>;
	};

	if (!body.title) {
		return NextResponse.json({ error: "Title is required" }, { status: 400 });
	}

	const slug = slugify(body.title);
	const lessonCount = Math.max(
		1,
		Math.min(255, body.modules?.reduce((n, m) => n + (m.lessons?.length ?? 0), 0) || 1)
	);
	const xpPerLesson = Math.max(0, Math.floor(Number(body.xpReward ?? 100)));
	const difficulty = levelToDifficulty(body.level || "beginner");
	const published = body.published ?? false;
	const programId = getProgramId();
	const connection = getSolanaConnection();
	const authority = loadBackendSigner();
	const [coursePda] = findCoursePDA(slug);

	// Check if course already exists on-chain
	const existingInfo = await connection.getAccountInfo(coursePda, "confirmed");
	if (existingInfo) {
		return NextResponse.json({
			onchain: { slug, coursePda: coursePda.toBase58(), created: false },
		});
	}

	// Build on-chain create (+ deactivate if unpublished) in one tx
	const createIx = buildCreateCourseInstruction({
		courseId: slug,
		creator: authority.publicKey,
		contentTxId: new Uint8Array(32),
		lessonCount,
		difficulty,
		xpPerLesson,
		trackId: 1,
		trackLevel: 1,
		prerequisite: null,
		creatorRewardXp: 0,
		minCompletionsForReward: 1,
		authority: authority.publicKey,
		programId,
	});

	const tx = new Transaction().add(createIx);
	if (!published) {
		tx.add(
			buildUpdateCourseInstruction({
				courseId: slug,
				newIsActive: false,
				authority: authority.publicKey,
				programId,
			})
		);
	}

	tx.feePayer = authority.publicKey;
	const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
	tx.recentBlockhash = blockhash;
	tx.sign(authority);

	let signature: string;
	try {
		signature = await connection.sendRawTransaction(tx.serialize());
		await connection.confirmTransaction(
			{ signature, blockhash, lastValidBlockHeight },
			"confirmed"
		);
	} catch (error) {
		return NextResponse.json(
			{
				error: "On-chain create failed",
				details: error instanceof Error ? error.message : "Unknown",
			},
			{ status: 502 }
		);
	}

	const onchainResult = { slug, coursePda: coursePda.toBase58(), created: true, signature };

	// Write CMS index (best-effort after on-chain success)
	const client = sanityWriteClient;
	if (!client) {
		return NextResponse.json(
			{
				onchain: onchainResult,
				warning: "On-chain created, but Sanity write token missing.",
			},
			{ status: 201 }
		);
	}

	const existingBySlug = await client.fetch<{ _id: string } | null>(
		`*[_type == "course" && slug.current == $slug][0]{ _id }`,
		{ slug }
	);

	const courseDoc = {
		_type: "course",
		title: body.title,
		slug: { _type: "slug" as const, current: slug },
		description: body.description ?? "",
		level: body.level || "beginner",
		duration: body.duration ?? "",
		xpReward: xpPerLesson,
		track: body.track ?? "",
		published,
		onchainStatus: "succeeded",
		coursePda: coursePda.toBase58(),
		createSignature: signature,
	};

	const course = existingBySlug
		? await client.patch(existingBySlug._id).set(courseDoc).commit()
		: await client.create(courseDoc);

	// Create module/lesson docs for brand-new courses
	if (!existingBySlug && body.modules?.length) {
		for (const mod of body.modules) {
			const moduleDoc = await client.create({
				_type: "module",
				title: mod.title,
				slug: { _type: "slug", current: slugify(mod.title) },
				description: mod.description ?? "",
				order: mod.order,
				course: { _ref: course._id },
			});
			for (const lesson of mod.lessons) {
				await client.create({
					_type: "lesson",
					title: lesson.title,
					slug: { _type: "slug", current: slugify(lesson.title) },
					order: lesson.order,
					xpReward: lesson.xpReward,
					duration: lesson.duration ?? "",
					module: { _ref: moduleDoc._id },
				});
			}
		}
	}

	return NextResponse.json(
		{ course, onchain: onchainResult },
		{ status: existingBySlug ? 200 : 201 }
	);
}
