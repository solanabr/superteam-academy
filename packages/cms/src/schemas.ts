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

/** Expanded author data returned by GROQ projections */
export type CourseAuthor = {
	_id: string;
	name: string;
	slug: SanitySlug;
	image?: SanityImage;
	bio?: SanityBlock[];
	walletAddress?: string;
};

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
	author?: { _ref: string } | CourseAuthor;
	onchainStatus?: "queued" | "running" | "succeeded" | "failed" | "draft";
	arweaveTxId?: string;
	coursePda?: string;
	createSignature?: string;
	lastSyncError?: string;
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

export type ChallengeDifficulty = "beginner" | "intermediate" | "advanced";

export type ChallengeInstruction = {
	title: string;
	content: string;
};

export type ChallengeTest = {
	id: string;
	description: string;
	type: "unit" | "integration";
};

export type ChallengeHint = {
	content: string;
	cost: number;
};

export type LessonChallenge = SanityDocument & {
	_type: "lessonChallenge";
	title: string;
	slug: SanitySlug;
	description: string;
	difficulty: ChallengeDifficulty;
	estimatedTime: string;
	xpReward: number;
	language: string;
	starterCode: string;
	instructions: ChallengeInstruction[];
	objectives: string[];
	tests: ChallengeTest[];
	hints: ChallengeHint[];
	published: boolean;
	course: { _ref: string };
	lesson: { _ref: string };
};

export type QuizQuestionOption = {
	id: string;
	text: string;
};

export type QuizQuestion = {
	id: string;
	prompt: string;
	options: QuizQuestionOption[];
	correctOptionId: string;
	explanation?: string;
};

export type LessonQuiz = SanityDocument & {
	_type: "lessonQuiz";
	title: string;
	slug: SanitySlug;
	passingScore: number;
	questions: QuizQuestion[];
	published: boolean;
	course: { _ref: string };
	lesson: { _ref: string };
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

export type UserRole = "learner" | "admin" | "superadmin";

export interface UserNotificationSettings {
	emailNotifications: boolean;
	pushNotifications: boolean;
	courseUpdates: boolean;
	achievementAlerts: boolean;
	weeklyDigest: boolean;
	marketingEmails: boolean;
	emailFrequency: "immediate" | "daily" | "weekly";
	pushFrequency: "immediate" | "daily" | "weekly";
}

export interface UserPrivacySettings {
	profileVisibility: "public" | "friends" | "private";
	showProgress: boolean;
	showAchievements: boolean;
	showActivity: boolean;
	allowMessaging: boolean;
	dataSharing: boolean;
	analyticsTracking: boolean;
}

export interface UserAppearanceSettings {
	theme: "light" | "dark" | "system";
	fontSize: "small" | "medium" | "large";
	reducedMotion: boolean;
}

export interface UserLanguageSettings {
	language: "en" | "pt-BR" | "es";
	dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
	timeFormat: "12h" | "24h";
	numberFormat: "pt-BR" | "en-US" | "es-ES";
	timezone: string;
}

export interface UserWalletSettings {
	autoConnect: boolean;
}

export interface UserSettings {
	notifications?: UserNotificationSettings;
	privacy?: UserPrivacySettings;
	appearance?: UserAppearanceSettings;
	language?: UserLanguageSettings;
	wallet?: UserWalletSettings;
}

export type LinkedAccountProvider = "wallet" | "google" | "github";

export interface LinkedAccountRecord {
	provider: LinkedAccountProvider;
	identifier: string;
	linkedAt: string;
}

export type AcademyUser = SanityDocument & {
	_type: "academyUser";
	authId: string;
	name: string;
	email: string;
	walletAddress?: string;
	image?: string;
	bio?: string;
	location?: string;
	website?: string;
	username?: string;
	role: UserRole;
	xpBalance: number;
	enrolledCourses: string[];
	completedCourses: string[];
	savedCourses: string[];

	title?: string;
	company?: string;
	education?: {
		degree?: string;
		institution?: string;
		graduationYear?: number;
	};

	experienceLevel?: "beginner" | "intermediate" | "advanced" | "expert";
	preferredTopics?: string[];
	learningGoals?: string[];
	timeCommitment?: "casual" | "regular" | "intensive";

	github?: string;
	linkedin?: string;
	twitter?: string;
	portfolio?: string;

	skills?: string[];
	languages?: string[]; // Programming languages
	timezone?: string;
	availability?: "open" | "busy" | "unavailable";

	onboardingCompleted?: boolean;
	onboardingStep?: number;
	profileCompleteness?: number;

	settings?: UserSettings;
	linkedAccounts?: LinkedAccountRecord[];
	lastActiveAt?: string;
};

export type DiscussionCategory =
	| "announcements"
	| "technicalQA"
	| "projectShowcase"
	| "featureRequests"
	| "studyGroups"
	| "offTopic";

export type Discussion = SanityDocument & {
	_type: "discussion";
	title: string;
	slug: SanitySlug;
	excerpt: string;
	content: SanityBlock[];
	author: { _ref: string };
	category: DiscussionCategory;
	tags: string[];
	pinned: boolean;
	solved: boolean;
	locked: boolean;
	views: number;
	points: number;
	publishedAt: string;
};

export type DiscussionComment = SanityDocument & {
	_type: "discussionComment";
	discussion: { _ref: string };
	content: SanityBlock[];
	author: { _ref: string };
	points: number;
	accepted: boolean;
	publishedAt: string;
};

export type EventType = "Workshop" | "AMA" | "Hackathon" | "Meetup";

export type EventStatus = "upcoming" | "ongoing" | "past" | "cancelled";

export type Event = SanityDocument & {
	_type: "event";
	title: string;
	slug: SanitySlug;
	description: string;
	type: EventType;
	status: EventStatus;
	startDate: string;
	endDate?: string;
	timezone: string;
	location?: string;
	isOnline: boolean;
	image?: SanityImage;
	maxAttendees?: number;
	registrationUrl?: string;
	recordingUrl?: string;
	speakers: Array<{
		name: string;
		role: string;
		image?: SanityImage;
	}>;
	tags: string[];
	publishedAt: string;
};

export type EventRegistration = SanityDocument & {
	_type: "eventRegistration";
	event: { _ref: string };
	user: { _ref: string };
	registeredAt: string;
	attended?: boolean;
};

export type ProjectCategory = "defi" | "nft" | "tooling" | "gaming" | "social" | "infra";

export type Project = SanityDocument & {
	_type: "project";
	title: string;
	slug: SanitySlug;
	description: string;
	author: { _ref: string };
	category: ProjectCategory;
	tags: string[];
	githubUrl?: string;
	liveUrl?: string;
	image?: SanityImage;
	featured: boolean;
	stars: number;
	contributors: number;
	xpReward?: number;
	publishedAt: string;
};

export type CommunityMember = SanityDocument & {
	_type: "communityMember";
	user: { _ref: string };
	title?: string;
	badges: string[];
	streak: number;
	joinedAt: string;
};

export type NewsletterSubscriber = SanityDocument & {
	_type: "newsletterSubscriber";
	email: string;
	status: "active" | "unsubscribed" | "bounced";
	subscribedAt: string;
	unsubscribedAt?: string;
	source?: string;
	locale?: string;
};

export type LessonNote = SanityDocument & {
	_type: "lessonNote";
	lessonId: string;
	user: { _ref: string };
	title: string;
	content: string;
	timestamp: number;
};
