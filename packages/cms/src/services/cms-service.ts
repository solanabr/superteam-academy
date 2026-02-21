import type { createClient } from "next-sanity";
import type { SanityImageSource } from "../image";
import { createImageUrlBuilder } from "../image";

type SanityClient = ReturnType<typeof createClient>;

export interface CMSConfig {
	projectId: string;
	dataset: string;
}

export class CMSService {
	protected client: SanityClient | null;
	protected imageUrlBuilder: ReturnType<typeof createImageUrlBuilder> | null;
	protected isConfigured: boolean;

	constructor(client: SanityClient | null, config: CMSConfig | null) {
		this.client = client;
		this.isConfigured = Boolean(client && config);
		this.imageUrlBuilder =
			this.isConfigured && config
				? createImageUrlBuilder({ projectId: config.projectId, dataset: config.dataset })
				: null;
	}

	protected async fetch<T>(query: string, params?: Record<string, unknown>): Promise<T | null> {
		if (!this.client) return null;
		if (params) {
			return this.client.fetch<T>(query, params);
		}
		return this.client.fetch<T>(query);
	}

	protected resolveImageUrl(
		image: SanityImageSource | undefined,
		width = 1200,
		height = 675
	): string | null {
		if (!this.imageUrlBuilder || !image) return null;
		return this.imageUrlBuilder(image).width(width).height(height).fit("crop").url();
	}

	get configured(): boolean {
		return this.isConfigured;
	}
}
