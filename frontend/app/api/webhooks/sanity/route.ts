import { type NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { headers } from "next/headers";

// Sanity webhook secret for verification
const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;

function getWebhookSecret(): string {
	if (!SANITY_WEBHOOK_SECRET) {
		throw new Error("SANITY_WEBHOOK_SECRET environment variable is required");
	}
	return SANITY_WEBHOOK_SECRET;
}

// Verify webhook signature from Sanity
async function verifyWebhook(request: NextRequest): Promise<boolean> {
	try {
		const headersList = await headers();
		const signature = headersList.get("sanity-webhook-signature");
		if (!signature) {
			console.error("No webhook signature provided");
			return false;
		}

		// Get raw body for signature verification
		const body = await request.text();
		const encoder = new TextEncoder();
		const data = encoder.encode(body);
		const key = encoder.encode(getWebhookSecret());

		// Import crypto for HMAC verification
		const crypto = await import("node:crypto");
		const hmac = crypto.createHmac("sha256", key);
		hmac.update(data);
		const expectedSignature = `sha256=${hmac.digest("hex")}`;

		// Use constant-time comparison to prevent timing attacks
		return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
	} catch (error) {
		console.error("Webhook verification failed:", error);
		return false;
	}
}

export async function POST(request: NextRequest) {
	try {
		// Verify webhook authenticity
		const isValid = await verifyWebhook(request);
		if (!isValid) {
			console.error("Invalid webhook signature");
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		// Parse webhook payload
		const body = await request.json();
		const { _type, operation, documentId } = body;

		// Handle different content types and operations
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

		// Revalidate homepage and course listing pages
		revalidatePath("/");
		revalidatePath("/courses");

		// Revalidate specific content pages if documentId is provided
		if (documentId) {
			revalidatePath(`/courses/${documentId}`);
			revalidateTag(`course-${documentId}`, "default");
			revalidateTag(`content-${documentId}`, "default");
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

// Handle course content updates
async function handleCourseUpdate(operation: string, documentId: string) {
	// Revalidate course-specific cache tags
	revalidateTag("courses", "default");
	revalidateTag(`course-${documentId}`, "default");

	// Revalidate course listing and detail pages
	revalidatePath("/courses");
	revalidatePath(`/courses/${documentId}`);

	// If course was deleted, also revalidate related modules and lessons
	if (operation === "delete") {
		revalidateTag(`course-modules-${documentId}`, "default");
		revalidateTag(`course-lessons-${documentId}`, "default");
	}
}

// Handle module content updates
async function handleModuleUpdate(_operation: string, documentId: string) {
	// Revalidate module-specific cache tags
	revalidateTag("modules", "default");
	revalidateTag(`module-${documentId}`, "default");

	// Revalidate module-related pages
	revalidatePath(`/modules/${documentId}`);
	revalidateTag(`module-lessons-${documentId}`, "default");
}

// Handle lesson content updates
async function handleLessonUpdate(_operation: string, documentId: string) {
	// Revalidate lesson-specific cache tags
	revalidateTag("lessons", "default");
	revalidateTag(`lesson-${documentId}`, "default");

	// Revalidate lesson-related pages
	revalidatePath(`/lessons/${documentId}`);
}

// Health check endpoint for webhook monitoring
export async function GET() {
	return NextResponse.json({
		status: "ok",
		message: "Sanity webhook endpoint is active",
	});
}
