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
} from "@superteam-academy/cms";

const communityService = createCommunityService(cmsContext);

export async function getAllDiscussions(): Promise<DiscussionWithMeta[]> {
	return communityService.getAllDiscussions();
}

export async function getDiscussionBySlug(slug: string): Promise<DiscussionWithMeta | null> {
	return communityService.getDiscussionBySlug(slug);
}

export async function getDiscussionsByCategory(
	category: DiscussionCategory
): Promise<DiscussionWithMeta[]> {
	return communityService.getDiscussionsByCategory(category);
}

export async function getDiscussionsByTag(tag: string): Promise<DiscussionWithMeta[]> {
	return communityService.getDiscussionsByTag(tag);
}

export async function getTrendingDiscussions(): Promise<DiscussionWithMeta[]> {
	return communityService.getTrendingDiscussions();
}

export async function getUnansweredDiscussions(): Promise<DiscussionWithMeta[]> {
	return communityService.getUnansweredDiscussions();
}

export async function getUpcomingEvents(): Promise<EventWithMeta[]> {
	return communityService.getUpcomingEvents();
}

export async function getPastEvents(): Promise<EventWithMeta[]> {
	return communityService.getPastEvents();
}

export async function getEventBySlug(slug: string): Promise<EventWithMeta | null> {
	return communityService.getEventBySlug(slug);
}

export async function getEventsByStatus(status: EventStatus): Promise<EventWithMeta[]> {
	return communityService.getEventsByStatus(status);
}

export function resolveEventImageUrl(
	image: EventWithMeta["image"] | undefined,
	width = 1200,
	height = 675
) {
	return communityService.resolveEventImageUrl(image, width, height);
}

export async function getAllProjects(): Promise<ProjectWithMeta[]> {
	return communityService.getAllProjects();
}

export async function getFeaturedProjects(): Promise<ProjectWithMeta[]> {
	return communityService.getFeaturedProjects();
}

export async function getProjectBySlug(slug: string): Promise<ProjectWithMeta | null> {
	return communityService.getProjectBySlug(slug);
}

export async function getProjectsByCategory(category: ProjectCategory): Promise<ProjectWithMeta[]> {
	return communityService.getProjectsByCategory(category);
}

export function resolveProjectImageUrl(
	image: ProjectWithMeta["image"] | undefined,
	width = 800,
	height = 450
) {
	return communityService.resolveProjectImageUrl(image, width, height);
}

export async function getAllMembers(): Promise<MemberWithMeta[]> {
	return communityService.getAllMembers();
}

export async function getTopMembers(limit = 10): Promise<MemberWithMeta[]> {
	return communityService.getTopMembers(limit);
}

export async function getMembersByBadge(badge: string): Promise<MemberWithMeta[]> {
	return communityService.getMembersByBadge(badge);
}

export function resolveUserImageUrl(
	image: { _type: "image"; asset: { _ref: string; _type: "reference" } } | undefined,
	size = 128
) {
	return communityService.resolveUserImageUrl(image, size);
}

// Re-export types for convenience
export type {
	DiscussionWithMeta,
	EventWithMeta,
	ProjectWithMeta,
	MemberWithMeta,
	DiscussionCategory,
	EventStatus,
	ProjectCategory,
};

export { isSanityConfigured };
