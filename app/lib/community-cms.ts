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
    CreateCommentInput,
    CommentWithMeta,
} from "@superteam-academy/cms";

const communityService = createCommunityService(cmsContext);

export const {
	createComment,
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
	CreateCommentInput,
	CommentWithMeta,
};

export { isSanityConfigured };
