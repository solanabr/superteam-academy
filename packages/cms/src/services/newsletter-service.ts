import { CMSService } from "./cms-service";
import type { createClient } from "next-sanity";
import type { CMSConfig } from "./cms-service";
import type { NewsletterSubscriber } from "../schemas";

type SanityClient = ReturnType<typeof createClient>;

export class NewsletterService extends CMSService {
	constructor(client: SanityClient | null, config: CMSConfig | null) {
		super(client, config);
	}

	/**
	 * Subscribe an email to the newsletter
	 */
	async subscribe(
		email: string,
		options?: {
			source?: string;
			locale?: string;
		}
	): Promise<{ success: boolean; subscriber?: NewsletterSubscriber; error?: string }> {
		if (!this.client) {
			return { success: false, error: "Sanity client not configured" };
		}

		try {
			// Check if email already exists
			const existing = await this.fetch<NewsletterSubscriber>(
				`*[_type == "newsletterSubscriber" && email == $email][0]`,
				{ email }
			);

			if (existing) {
				// If previously unsubscribed, reactivate
				if (existing.status === "unsubscribed") {
					const updated = await this.client
						.patch(existing._id)
						.set({
							status: "active",
							unsubscribedAt: null,
							subscribedAt: new Date().toISOString(),
						})
						.commit();

					return { success: true, subscriber: updated as NewsletterSubscriber };
				}

				// Already subscribed
				return { success: true, subscriber: existing };
			}

			// Create new subscriber
			const subscriber = await this.client.create({
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
	}

	/**
	 * Unsubscribe an email from the newsletter
	 */
	async unsubscribe(email: string): Promise<{ success: boolean; error?: string }> {
		if (!this.client) {
			return { success: false, error: "Sanity client not configured" };
		}

		try {
			const subscriber = await this.fetch<NewsletterSubscriber>(
				`*[_type == "newsletterSubscriber" && email == $email][0]`,
				{ email }
			);

			if (!subscriber) {
				return { success: false, error: "Email not found" };
			}

			await this.client
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
	}

	/**
	 * Get subscriber by email
	 */
	async getSubscriber(email: string): Promise<NewsletterSubscriber | null> {
		return this.fetch<NewsletterSubscriber>(
			`*[_type == "newsletterSubscriber" && email == $email][0]`,
			{ email }
		);
	}

	/**
	 * Get all active subscribers
	 */
	async getActiveSubscribers(): Promise<NewsletterSubscriber[]> {
		const subscribers = await this.fetch<NewsletterSubscriber[]>(
			`*[_type == "newsletterSubscriber" && status == "active"] | order(subscribedAt desc)`
		);
		return subscribers || [];
	}

	/**
	 * Get subscriber count by status
	 */
	async getSubscriberCount(status?: "active" | "unsubscribed" | "bounced"): Promise<number> {
		const query = status
			? `count(*[_type == "newsletterSubscriber" && status == $status])`
			: `count(*[_type == "newsletterSubscriber"])`;

		const count = await this.fetch<number>(query, status ? { status } : undefined);
		return count || 0;
	}
}
