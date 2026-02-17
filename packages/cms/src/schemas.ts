/** Sanity document type definitions for the academy CMS */

export type SanityDocument = {
	_id: string;
	_type: string;
	_rev: string;
	_createdAt: string;
	_updatedAt: string;
};

export type SanitySlug = {
	_type: "slug";
	current: string;
};

export type SanityImage = {
	_type: "image";
	asset: { _ref: string; _type: "reference" };
	alt?: string;
};

export type SanityBlock = {
	_type: "block";
	_key: string;
	children: Array<{ _type: "span"; text: string; marks?: string[] }>;
	style?: string;
	markDefs?: Array<{ _key: string; _type: string; href?: string }>;
};

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type Course = SanityDocument & {
	_type: "course";
	title: string;
	slug: SanitySlug;
	description?: string;
	level: CourseLevel;
	duration?: string;
	image?: SanityImage;
	published: boolean;
	xpReward: number;
	track?: string;
	modules?: Module[];
};

export type Module = SanityDocument & {
	_type: "module";
	title: string;
	slug: SanitySlug;
	description?: string;
	order: number;
	course?: { _ref: string };
	lessons?: Lesson[];
};

export type Lesson = SanityDocument & {
	_type: "lesson";
	title: string;
	slug: SanitySlug;
	content?: SanityBlock[];
	order: number;
	module?: { _ref: string };
	xpReward: number;
	duration?: string;
};

export type Author = SanityDocument & {
	_type: "author";
	name: string;
	slug: SanitySlug;
	image?: SanityImage;
	bio?: SanityBlock[];
	walletAddress?: string;
};

export type Track = SanityDocument & {
	_type: "track";
	title: string;
	slug: SanitySlug;
	description?: string;
	image?: SanityImage;
	courses?: Array<{ _ref: string }>;
};
