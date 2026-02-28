import type { createClient } from "next-sanity";
import type { SanityImageSource } from "../image";
import { createImageUrlBuilder } from "../image";

type SanityClient = ReturnType<typeof createClient>;

export interface CMSConfig {
	projectId: string;
	dataset: string;
}

export type CMSContextInput = {
	readClient: SanityClient | null;
	writeClient?: SanityClient | null;
	config: CMSConfig | null;
};

export type CMSContext = {
	readClient: SanityClient | null;
	writeClient: SanityClient | null;
	configured: boolean;
	fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T | null>;
	resolveImageUrl: (
		image: SanityImageSource | undefined,
		width?: number,
		height?: number
	) => string | null;
};

export function createCmsContext({
	readClient,
	writeClient = null,
	config,
}: CMSContextInput): CMSContext {
	const activeReadClient = readClient ?? writeClient ?? null;
	const configured = Boolean(activeReadClient && config);
	const imageUrlBuilder =
		configured && config
			? createImageUrlBuilder({ projectId: config.projectId, dataset: config.dataset })
			: null;

	const fetch = async <T>(query: string, params?: Record<string, unknown>): Promise<T | null> => {
		if (!activeReadClient) return null;
		if (params) {
			return activeReadClient.fetch<T>(query, params);
		}
		return activeReadClient.fetch<T>(query);
	};

	const resolveImageUrl = (
		image: SanityImageSource | undefined,
		width = 1200,
		height = 675
	): string | null => {
		if (!imageUrlBuilder || !image) return null;
		// biome-ignore lint/suspicious/noFocusedTests: .fit() is a Sanity image builder method, not a test
		return imageUrlBuilder(image).width(width).height(height).fit("crop").url();
	};

	return {
		readClient: activeReadClient,
		writeClient,
		configured,
		fetch,
		resolveImageUrl,
	};
}
