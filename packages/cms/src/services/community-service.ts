import type {
	Discussion,
	Event,
	Project,
	CommunityMember,
	DiscussionCategory,
	EventStatus,
	ProjectCategory,
} from "../schemas";
import { CMSService } from "./cms-service";
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

export class CommunityService extends CMSService {
	// ── Discussions ────────────────────────────────────────────

	async getAllDiscussions(): Promise<DiscussionWithMeta[]> {
		if (!this.client) return [];
		return (await this.fetch<DiscussionWithMeta[]>(allDiscussionsQuery)) || [];
	}

	async getDiscussionBySlug(slug: string): Promise<DiscussionWithMeta | null> {
		if (!this.client) return null;
		return this.fetch<DiscussionWithMeta | null>(discussionBySlugQuery, { slug });
	}

	async getDiscussionsByCategory(category: DiscussionCategory): Promise<DiscussionWithMeta[]> {
		if (!this.client) return [];
		return (
			(await this.fetch<DiscussionWithMeta[]>(discussionsByCategoryQuery, { category })) || []
		);
	}

	async getDiscussionsByTag(tag: string): Promise<DiscussionWithMeta[]> {
		if (!this.client) return [];
		return (await this.fetch<DiscussionWithMeta[]>(discussionsByTagQuery, { tag })) || [];
	}

	async getTrendingDiscussions(): Promise<DiscussionWithMeta[]> {
		const discussions = await this.getAllDiscussions();
		return discussions.sort((a, b) => b.points - a.points);
	}

	async getUnansweredDiscussions(): Promise<DiscussionWithMeta[]> {
		const discussions = await this.getAllDiscussions();
		return discussions.filter((d) => !d.solved);
	}

	// ── Events ─────────────────────────────────────────────────

	async getUpcomingEvents(): Promise<EventWithMeta[]> {
		if (!this.client) return [];
		return (await this.fetch<EventWithMeta[]>(upcomingEventsQuery)) || [];
	}

	async getPastEvents(): Promise<EventWithMeta[]> {
		if (!this.client) return [];
		return (await this.fetch<EventWithMeta[]>(pastEventsQuery)) || [];
	}

	async getEventBySlug(slug: string): Promise<EventWithMeta | null> {
		if (!this.client) return null;
		return this.fetch<EventWithMeta | null>(eventBySlugQuery, { slug });
	}

	async getEventsByStatus(status: EventStatus): Promise<EventWithMeta[]> {
		if (!this.client) return [];
		return (
			(await this.fetch<EventWithMeta[]>(
				`*[_type == "event" && status == $status] | order(startDate ${status === "past" ? "desc" : "asc"}) {
					_id,_type,_createdAt,_updatedAt,title,slug,description,type,status,startDate,endDate,timezone,location,isOnline,image,maxAttendees,registrationUrl,recordingUrl,speakers,tags,publishedAt,
					"attendeeCount": count(*[_type == "eventRegistration" && references(^._id)])
				}`,
				{ status }
			)) || []
		);
	}

	// ── Projects ───────────────────────────────────────────────

	async getAllProjects(): Promise<ProjectWithMeta[]> {
		if (!this.client) return [];
		return (await this.fetch<ProjectWithMeta[]>(allProjectsQuery)) || [];
	}

	async getFeaturedProjects(): Promise<ProjectWithMeta[]> {
		if (!this.client) return [];
		return (await this.fetch<ProjectWithMeta[]>(featuredProjectsQuery)) || [];
	}

	async getProjectBySlug(slug: string): Promise<ProjectWithMeta | null> {
		if (!this.client) return null;
		return this.fetch<ProjectWithMeta | null>(projectBySlugQuery, { slug });
	}

	async getProjectsByCategory(category: ProjectCategory): Promise<ProjectWithMeta[]> {
		if (!this.client) return [];
		return (await this.fetch<ProjectWithMeta[]>(projectsByCategoryQuery, { category })) || [];
	}

	// ── Members ────────────────────────────────────────────────

	async getAllMembers(): Promise<MemberWithMeta[]> {
		if (!this.client) return [];
		return (await this.fetch<MemberWithMeta[]>(allMembersQuery)) || [];
	}

	async getTopMembers(limit = 10): Promise<MemberWithMeta[]> {
		if (!this.client) return [];
		return (await this.fetch<MemberWithMeta[]>(topMembersQuery, { limit })) || [];
	}

	async getMembersByBadge(badge: string): Promise<MemberWithMeta[]> {
		if (!this.client) return [];
		return (await this.fetch<MemberWithMeta[]>(membersByBadgeQuery, { badge })) || [];
	}

	// ── Image resolution ───────────────────────────────────────

	resolveEventImageUrl(image: Event["image"] | undefined, width = 1200, height = 675) {
		return this.resolveImageUrl(image, width, height);
	}

	resolveProjectImageUrl(image: Project["image"] | undefined, width = 800, height = 450) {
		return this.resolveImageUrl(image, width, height);
	}

	resolveUserImageUrl(
		image: { _type: "image"; asset: { _ref: string; _type: "reference" } } | undefined,
		size = 128
	) {
		return this.resolveImageUrl(image, size, size);
	}
}
