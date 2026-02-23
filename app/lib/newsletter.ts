import { createNewsletterService } from "@superteam-academy/cms";
import { cmsContext, isSanityConfigured } from "./cms-context";

const newsletterService = createNewsletterService(cmsContext);

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
