import { createSanityClient } from "@superteam/cms";
import { NewsletterService } from "@superteam/cms";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_TOKEN; // Server-side only token with write permissions

const isSanityConfigured = Boolean(projectId && token);

// Create authenticated client for write operations
const client =
	isSanityConfigured && projectId && token
		? createSanityClient({
				projectId,
				dataset,
				token,
				useCdn: false, // Don't use CDN for write operations
			})
		: null;

// Initialize newsletter service
const newsletterService = new NewsletterService(
	client,
	isSanityConfigured && projectId ? { projectId, dataset } : null
);

export async function subscribeToNewsletter(
	email: string,
	options?: {
		source?: string;
		locale?: string;
	}
) {
	return newsletterService.subscribe(email, options);
}

export async function unsubscribeFromNewsletter(email: string) {
	return newsletterService.unsubscribe(email);
}

export async function getNewsletterSubscriber(email: string) {
	return newsletterService.getSubscriber(email);
}

export async function getActiveSubscribers() {
	return newsletterService.getActiveSubscribers();
}

export async function getSubscriberCount(status?: "active" | "unsubscribed" | "bounced") {
	return newsletterService.getSubscriberCount(status);
}

export { isSanityConfigured as isNewsletterConfigured };
