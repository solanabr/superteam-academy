import "server-only";

import { createCmsContext, createSanityClient } from "@superteam/cms";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const writeToken = process.env.SANITY_API_WRITE_TOKEN;

export const isSanityConfigured = Boolean(projectId);

export const readClient =
	isSanityConfigured && projectId
		? createSanityClient({
				projectId,
				dataset,
				token: process.env.SANITY_API_READ_TOKEN ?? "",
			})
		: null;
export const writeClient =
	isSanityConfigured && projectId && writeToken
		? createSanityClient({
				projectId,
				dataset,
				token: writeToken,
				useCdn: false,
			})
		: null;

export const cmsContext = createCmsContext({
	readClient,
	writeClient,
	config: isSanityConfigured && projectId ? { projectId, dataset } : null,
});
