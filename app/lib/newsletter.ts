import { createNewsletterService } from "@superteam-academy/cms";
import { cmsContext, isSanityConfigured } from "./cms-context";

const newsletterService = createNewsletterService(cmsContext);

export const {
	subscribe: subscribeToNewsletter,
	unsubscribe: unsubscribeFromNewsletter,
	getSubscriber: getNewsletterSubscriber,
	getActiveSubscribers,
	getSubscriberCount,
} = newsletterService;

export { isSanityConfigured as isNewsletterConfigured };
