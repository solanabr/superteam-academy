import { createClient } from "next-sanity";

export type SanityClientConfig = {
	projectId: string;
	dataset: string;
	apiVersion?: string;
	useCdn?: boolean;
	token?: string;
};

const defaults = {
	apiVersion: "2025-01-01",
	useCdn: true,
} satisfies Partial<SanityClientConfig>;

export function createSanityClient(config: SanityClientConfig) {
	return createClient({ ...defaults, ...config });
}
