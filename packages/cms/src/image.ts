import imageUrlBuilder from "@sanity/image-url";
import type { SanityClientConfig } from "./client";
import { createSanityClient } from "./client";

export type SanityImageSource = {
	_type: "image";
	asset: {
		_ref: string;
		_type: "reference";
	};
};

export function createImageUrlBuilder(config: SanityClientConfig) {
	const client = createSanityClient(config);
	const builder = imageUrlBuilder(client);

	return function urlFor(source: SanityImageSource) {
		return builder.image(source);
	};
}
