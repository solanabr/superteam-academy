import type { CMSContext } from "./cms-service";
import type { NewsletterSubscriber } from "../schemas";
export function createNewsletterService(context: CMSContext) {
	const { fetch, writeClient } = context;

	const subscribe = async (
		email: string,
		options?: {
			source?: string;
			locale?: string;
		}
	): Promise<{ success: boolean; subscriber?: NewsletterSubscriber; error?: string }> => {
		if (!writeClient) {
			return { success: false, error: "Sanity client not configured" };
		}

		try {
			const existing = await fetch<NewsletterSubscriber>(
				`*[_type == "newsletterSubscriber" && email == $email][0]`,
				{ email }
			);

			if (existing) {
				if (existing.status === "unsubscribed") {
					const updated = await writeClient
						.patch(existing._id)
						.set({
							status: "active",
							unsubscribedAt: null,
							subscribedAt: new Date().toISOString(),
						})
						.commit();

					return { success: true, subscriber: updated as NewsletterSubscriber };
				}

				return { success: true, subscriber: existing };
			}

			const subscriber = await writeClient.create({
				_type: "newsletterSubscriber" as const,
				email,
				status: "active" as const,
				subscribedAt: new Date().toISOString(),
				source: options?.source || "homepage",
				locale: options?.locale || "en",
			});

			return { success: true, subscriber: subscriber as NewsletterSubscriber };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	};

	const unsubscribe = async (email: string): Promise<{ success: boolean; error?: string }> => {
		if (!writeClient) {
			return { success: false, error: "Sanity client not configured" };
		}

		try {
			const subscriber = await fetch<NewsletterSubscriber>(
				`*[_type == "newsletterSubscriber" && email == $email][0]`,
				{ email }
			);

			if (!subscriber) {
				return { success: false, error: "Email not found" };
			}

			await writeClient
				.patch(subscriber._id)
				.set({
					status: "unsubscribed",
					unsubscribedAt: new Date().toISOString(),
				})
				.commit();

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	};

	const getSubscriber = async (email: string): Promise<NewsletterSubscriber | null> => {
		return fetch<NewsletterSubscriber>(
			`*[_type == "newsletterSubscriber" && email == $email][0]`,
			{ email }
		);
	};

	const getActiveSubscribers = async (): Promise<NewsletterSubscriber[]> => {
		const subscribers = await fetch<NewsletterSubscriber[]>(
			`*[_type == "newsletterSubscriber" && status == "active"] | order(subscribedAt desc)`
		);
		return subscribers || [];
	};

	const getSubscriberCount = async (
		status?: "active" | "unsubscribed" | "bounced"
	): Promise<number> => {
		const query = status
			? `count(*[_type == "newsletterSubscriber" && status == $status])`
			: `count(*[_type == "newsletterSubscriber"])`;

		const count = await fetch<number>(query, status ? { status } : undefined);
		return count || 0;
	};

	return {
		subscribe,
		unsubscribe,
		getSubscriber,
		getActiveSubscribers,
		getSubscriberCount,
	};
}
