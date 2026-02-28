import { type NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSanityClient } from "@superteam-academy/cms";
import {
	enqueueCourseSyncJob,
	getCourseSyncJobs,
	processCourseSyncQueue,
} from "@/lib/course-sync-jobs";
import { maybeRunAutoCourseIndexReconcile } from "@/lib/course-index-sync";

// Sanity webhook secret for verification
const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;

function getWebhookSecret(): string {
	if (!SANITY_WEBHOOK_SECRET) {
		throw new Error("SANITY_WEBHOOK_SECRET environment variable is required");
	}
	return SANITY_WEBHOOK_SECRET;
}

// Verify webhook signature from Sanity
async function verifyWebhook(requestBody: string): Promise<boolean> {
	try {
		const headersList = await headers();
		const signature = headersList.get("sanity-webhook-signature");
		if (!signature) {
			console.error("No webhook signature provided");
			return false;
		}

		const encoder = new TextEncoder();
		const data = encoder.encode(requestBody);
		const key = encoder.encode(getWebhookSecret());

		const crypto = await import("node:crypto");
		const hmac = crypto.createHmac("sha256", key);
		hmac.update(data);
		const expectedSignature = `sha256=${hmac.digest("hex")}`;

		return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
	} catch (error) {
		console.error("Webhook verification failed:", error);
		return false;
	}
}

export async function POST(request: NextRequest) {
	try {
		const rawBody = await request.text();

		const isValid = await verifyWebhook(rawBody);
		if (!isValid) {
			console.error("Invalid webhook signature");
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		const body = JSON.parse(rawBody) as {
			_type?: string;
			operation?: string;
			documentId?: string;
		};
		const { _type, operation, documentId } = body;
		if (!_type || !operation || !documentId) {
			return NextResponse.json({
				success: true,
				message: "Webhook payload missing required fields",
			});
		}

		switch (_type) {
			case "course":
				await handleCourseUpdate(operation, documentId);
				break;
			case "module":
				await handleModuleUpdate(operation, documentId);
				break;
			case "lesson":
				await handleLessonUpdate(operation, documentId);
				break;
			default:
		}

		revalidatePath("/");
		revalidatePath("/courses");

		revalidatePath(`/courses/${documentId}`);
		revalidateTag(`course-${documentId}`, "default");
		revalidateTag(`content-${documentId}`, "default");

		if (_type === "course" && (operation === "create" || operation === "update")) {
			await triggerOnchainCourseSync(documentId);
		}

		if (process.env.ENABLE_COURSE_INDEX_AUTO_RECONCILE !== "false") {
			const minIntervalMs = Number(process.env.COURSE_INDEX_SYNC_INTERVAL_MS ?? 300_000);
			await maybeRunAutoCourseIndexReconcile({
				minIntervalMs: Number.isFinite(minIntervalMs) ? minIntervalMs : 300_000,
			});
		}

		return NextResponse.json({
			success: true,
			message: "Webhook processed successfully",
		});
	} catch (error) {
		console.error("Webhook processing error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

async function triggerOnchainCourseSync(documentId: string) {
	if (process.env.ENABLE_SANITY_ONCHAIN_SYNC !== "true") return;

	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_READ_TOKEN;
	if (!projectId || !token) return;

	const client = createSanityClient({ projectId, dataset, token, useCdn: false });
	const doc = await client.fetch<{ slug?: { current?: string } } | null>(
		`*[_type == "course" && _id == $id][0]{ slug }`,
		{ id: documentId }
	);

	const courseId = doc?.slug?.current;
	if (!courseId) return;

	await enqueueCourseSyncJob(documentId, courseId);
	void processCourseSyncQueue();
}

// Handle course content updates
async function handleCourseUpdate(operation: string, documentId: string) {
	revalidateTag("courses", "default");
	revalidateTag(`course-${documentId}`, "default");

	revalidatePath("/courses");
	revalidatePath(`/courses/${documentId}`);

	if (operation === "delete") {
		revalidateTag(`course-modules-${documentId}`, "default");
		revalidateTag(`course-lessons-${documentId}`, "default");
	}
}

// Handle module content updates
async function handleModuleUpdate(_operation: string, documentId: string) {
	revalidateTag("modules", "default");
	revalidateTag(`module-${documentId}`, "default");

	revalidatePath(`/modules/${documentId}`);
	revalidateTag(`module-lessons-${documentId}`, "default");
}

// Handle lesson content updates
async function handleLessonUpdate(_operation: string, documentId: string) {
	revalidateTag("lessons", "default");
	revalidateTag(`lesson-${documentId}`, "default");

	revalidatePath(`/lessons/${documentId}`);
}

// Health check endpoint for webhook monitoring
export async function GET() {
	const jobs = await getCourseSyncJobs(20);
	return NextResponse.json({
		status: "ok",
		message: "Sanity webhook endpoint is active",
		jobs,
	});
}
