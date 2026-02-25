import type {
	Discussion,
	Event,
	Project,
	CommunityMember,
	DiscussionCategory,
	EventStatus,
	EventType,
	ProjectCategory,
} from "../schemas";
import type { CMSContext } from "./cms-service";
import {
	allDiscussionsQuery,
	discussionBySlugQuery,
	discussionsByCategoryQuery,
	discussionsByTagQuery,
	upcomingEventsQuery,
	pastEventsQuery,
	eventBySlugQuery,
	allProjectsQuery,
	featuredProjectsQuery,
	projectBySlugQuery,
	projectsByCategoryQuery,
	allMembersQuery,
	topMembersQuery,
	membersByBadgeQuery,
} from "../queries";

export interface DiscussionWithMeta extends Omit<Discussion, "author"> {
	author: {
		_id: string;
		name: string;
		image?: string;
	};
	commentCount: number;
}

export interface EventWithMeta extends Event {
	attendeeCount: number;
}

export interface ProjectWithMeta extends Omit<Project, "author"> {
	author: {
		_id: string;
		name: string;
		image?: string;
	};
}

export interface MemberWithMeta extends Omit<CommunityMember, "user"> {
	user: {
		_id: string;
		name: string;
		image?: string;
		xpBalance: number;
		courseCount: number;
	};
	achievementCount: number;
}

export interface CreateDiscussionInput {
	title: string;
	content: string;
	category: DiscussionCategory;
	tags: string[];
	authorId: string;
}

export interface CreateEventInput {
	title: string;
	description: string;
	type: EventType;
	startDate: string;
	endDate?: string | undefined;
	timezone: string;
	location?: string | undefined;
	isOnline: boolean;
	maxAttendees?: number;
	registrationUrl?: string | undefined;
	tags: string[];
}

export interface CreateProjectInput {
	title: string;
	description: string;
	category: ProjectCategory;
	tags: string[];
	authorId: string;
	githubUrl?: string | undefined;
	liveUrl?: string | undefined;
	xpReward?: number | undefined;
}

export function createCommunityService(context: CMSContext) {
	const { fetch, resolveImageUrl, readClient, writeClient } = context;

	const getAllDiscussions = async (): Promise<DiscussionWithMeta[]> => {
		if (!readClient) return [];
		return (await fetch<DiscussionWithMeta[]>(allDiscussionsQuery)) || [];
	};

	const getDiscussionBySlug = async (slug: string): Promise<DiscussionWithMeta | null> => {
		if (!readClient) return null;
		return fetch<DiscussionWithMeta | null>(discussionBySlugQuery, { slug });
	};

	const getDiscussionsByCategory = async (
		category: DiscussionCategory
	): Promise<DiscussionWithMeta[]> => {
		if (!readClient) return [];
		return (await fetch<DiscussionWithMeta[]>(discussionsByCategoryQuery, { category })) || [];
	};

	const getDiscussionsByTag = async (tag: string): Promise<DiscussionWithMeta[]> => {
		if (!readClient) return [];
		return (await fetch<DiscussionWithMeta[]>(discussionsByTagQuery, { tag })) || [];
	};

	const getTrendingDiscussions = async (): Promise<DiscussionWithMeta[]> => {
		const discussions = await getAllDiscussions();
		return discussions.sort((a, b) => b.points - a.points);
	};

	const getUnansweredDiscussions = async (): Promise<DiscussionWithMeta[]> => {
		const discussions = await getAllDiscussions();
		return discussions.filter((d) => !d.solved);
	};

	const getUpcomingEvents = async (): Promise<EventWithMeta[]> => {
		if (!readClient) return [];
		return (await fetch<EventWithMeta[]>(upcomingEventsQuery)) || [];
	};

	const getPastEvents = async (): Promise<EventWithMeta[]> => {
		if (!readClient) return [];
		return (await fetch<EventWithMeta[]>(pastEventsQuery)) || [];
	};

	const getEventBySlug = async (slug: string): Promise<EventWithMeta | null> => {
		if (!readClient) return null;
		return fetch<EventWithMeta | null>(eventBySlugQuery, { slug });
	};

	const getEventsByStatus = async (status: EventStatus): Promise<EventWithMeta[]> => {
		if (!readClient) return [];
		return (
			(await fetch<EventWithMeta[]>(
				`*[_type == "event" && status == $status] | order(startDate ${status === "past" ? "desc" : "asc"}) {
					_id,_type,_createdAt,_updatedAt,title,slug,description,type,status,startDate,endDate,timezone,location,isOnline,image,maxAttendees,registrationUrl,recordingUrl,speakers,tags,publishedAt,
					"attendeeCount": count(*[_type == "eventRegistration" && references(^._id)])
				}`,
				{ status }
			)) || []
		);
	};

	const getAllProjects = async (): Promise<ProjectWithMeta[]> => {
		if (!readClient) return [];
		return (await fetch<ProjectWithMeta[]>(allProjectsQuery)) || [];
	};

	const getFeaturedProjects = async (): Promise<ProjectWithMeta[]> => {
		if (!readClient) return [];
		return (await fetch<ProjectWithMeta[]>(featuredProjectsQuery)) || [];
	};

	const getProjectBySlug = async (slug: string): Promise<ProjectWithMeta | null> => {
		if (!readClient) return null;
		return fetch<ProjectWithMeta | null>(projectBySlugQuery, { slug });
	};

	const getProjectsByCategory = async (category: ProjectCategory): Promise<ProjectWithMeta[]> => {
		if (!readClient) return [];
		return (await fetch<ProjectWithMeta[]>(projectsByCategoryQuery, { category })) || [];
	};

	const getAllMembers = async (): Promise<MemberWithMeta[]> => {
		if (!readClient) return [];
		return (await fetch<MemberWithMeta[]>(allMembersQuery)) || [];
	};

	const getTopMembers = async (limit = 10): Promise<MemberWithMeta[]> => {
		if (!readClient) return [];
		return (await fetch<MemberWithMeta[]>(topMembersQuery, { limit })) || [];
	};

	const getMembersByBadge = async (badge: string): Promise<MemberWithMeta[]> => {
		if (!readClient) return [];
		return (await fetch<MemberWithMeta[]>(membersByBadgeQuery, { badge })) || [];
	};

	const resolveEventImageUrl = (
		image: Event["image"] | undefined,
		width = 1200,
		height = 675
	): string | null => resolveImageUrl(image, width, height);

	const resolveProjectImageUrl = (
		image: Project["image"] | undefined,
		width = 800,
		height = 450
	): string | null => resolveImageUrl(image, width, height);

	const resolveUserImageUrl = (
		image: { _type: "image"; asset: { _ref: string; _type: "reference" } } | undefined,
		size = 128
	): string | null => resolveImageUrl(image, size, size);

	const createDiscussion = async (
		input: CreateDiscussionInput
	): Promise<{ success: boolean; slug?: string; error?: string }> => {
		if (!writeClient) {
			return { success: false, error: "Sanity write client not configured" };
		}

		const slug = input.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");

		const doc = await writeClient.create({
			_type: "discussion" as const,
			title: input.title,
			slug: { _type: "slug", current: slug },
			excerpt: input.content.slice(0, 200),
			content: [
				{
					_type: "block",
					style: "normal",
					children: [{ _type: "span", text: input.content }],
				},
			],
			author: { _type: "reference", _ref: input.authorId },
			category: input.category,
			tags: input.tags,
			pinned: false,
			solved: false,
			locked: false,
			views: 0,
			points: 0,
			publishedAt: new Date().toISOString(),
		});

		return { success: true, slug: doc.slug?.current || slug };
	};

	const createEvent = async (
		input: CreateEventInput
	): Promise<{ success: boolean; slug?: string; error?: string }> => {
		if (!writeClient) {
			return { success: false, error: "Sanity write client not configured" };
		}

		const slug = input.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");

		const doc = await writeClient.create({
			_type: "event" as const,
			title: input.title,
			slug: { _type: "slug", current: slug },
			description: input.description,
			type: input.type,
			status: "upcoming" as const,
			startDate: input.startDate,
			endDate: input.endDate,
			timezone: input.timezone,
			location: input.location,
			isOnline: input.isOnline,
			maxAttendees: input.maxAttendees,
			registrationUrl: input.registrationUrl,
			speakers: [],
			tags: input.tags,
			publishedAt: new Date().toISOString(),
		});

		return { success: true, slug: doc.slug?.current || slug };
	};

	const createProject = async (
		input: CreateProjectInput
	): Promise<{ success: boolean; slug?: string; error?: string }> => {
		if (!writeClient) {
			return { success: false, error: "Sanity write client not configured" };
		}

		const slug = input.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");

		const doc = await writeClient.create({
			_type: "project" as const,
			title: input.title,
			slug: { _type: "slug", current: slug },
			description: input.description,
			author: { _type: "reference", _ref: input.authorId },
			category: input.category,
			tags: input.tags,
			githubUrl: input.githubUrl,
			liveUrl: input.liveUrl,
			featured: false,
			stars: 0,
			contributors: 0,
			xpReward: input.xpReward,
			publishedAt: new Date().toISOString(),
		});

		return { success: true, slug: doc.slug?.current || slug };
	};

	return {
		createDiscussion,
		createEvent,
		createProject,
		getAllDiscussions,
		getDiscussionBySlug,
		getDiscussionsByCategory,
		getDiscussionsByTag,
		getTrendingDiscussions,
		getUnansweredDiscussions,
		getUpcomingEvents,
		getPastEvents,
		getEventBySlug,
		getEventsByStatus,
		getAllProjects,
		getFeaturedProjects,
		getProjectBySlug,
		getProjectsByCategory,
		getAllMembers,
		getTopMembers,
		getMembersByBadge,
		resolveEventImageUrl,
		resolveProjectImageUrl,
		resolveUserImageUrl,
	};
}
