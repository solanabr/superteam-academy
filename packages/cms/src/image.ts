export { createImageUrlBuilder } from "@sanity/image-url";

export type SanityImageSource = {
	_type: "image";
	asset: {
		_ref: string;
		_type: "reference";
	};
};
