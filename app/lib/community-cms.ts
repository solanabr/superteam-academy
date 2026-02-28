import { createCommunityService } from "@superteam-academy/cms";
import { cmsContext, isSanityConfigured } from "./cms-context";
import type {
	DiscussionWithMeta,
	EventWithMeta,
	ProjectWithMeta,
	MemberWithMeta,
	DiscussionCategory,
	EventStatus,
	ProjectCategory,
	CreateDiscussionInput,
	CreateEventInput,
	CreateProjectInput,
} from "@superteam-academy/cms";

const communityService = createCommunityService(cmsContext);

export const {
	getAllDiscussions,
	getDiscussionBySlug,
	getDiscussionsByCategory,
	getDiscussionsByTag,
	getTrendingDiscussions,
	getUnansweredDiscussions,
	createDiscussion,
	createEvent,
	createProject,
	getUpcomingEvents,
	getPastEvents,
	getEventBySlug,
	getEventsByStatus,
	resolveEventImageUrl,
	getAllProjects,
	getFeaturedProjects,
	getProjectBySlug,
	getProjectsByCategory,
	resolveProjectImageUrl,
	getAllMembers,
	getTopMembers,
	getMembersByBadge,
	resolveUserImageUrl,
} = communityService;

export type {
	DiscussionWithMeta,
	EventWithMeta,
	ProjectWithMeta,
	MemberWithMeta,
	DiscussionCategory,
	EventStatus,
	ProjectCategory,
	CreateDiscussionInput,
	CreateEventInput,
	CreateProjectInput,
};

export { isSanityConfigured };
