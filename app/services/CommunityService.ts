import type {
	DiscussionWithMeta,
	EventWithMeta,
	ProjectWithMeta,
	MemberWithMeta,
} from "@superteam/cms";
import {
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
} from "@/lib/community-cms";

export class CommunityService {
	// Currently wraps CMS functions; on-chain integration will be added in future
	// biome-ignore lint/complexity/noUselessConstructor: Prepared for future on-chain params
	constructor() {
		// do nothing
	}

	// ── Discussions ────────────────────────────────────────────

	async getAllDiscussions(): Promise<DiscussionWithMeta[]> {
		return getAllDiscussions();
	}

	async getDiscussionBySlug(slug: string): Promise<DiscussionWithMeta | null> {
		return getDiscussionBySlug(slug);
	}

	async getDiscussionsByCategory(category: string): Promise<DiscussionWithMeta[]> {
		return getDiscussionsByCategory(category as never);
	}

	async getDiscussionsByTag(tag: string): Promise<DiscussionWithMeta[]> {
		return getDiscussionsByTag(tag);
	}

	async getTrendingDiscussions(): Promise<DiscussionWithMeta[]> {
		return getTrendingDiscussions();
	}

	async getUnansweredDiscussions(): Promise<DiscussionWithMeta[]> {
		return getUnansweredDiscussions();
	}

	// ── Events ─────────────────────────────────────────────────

	async getUpcomingEvents(): Promise<EventWithMeta[]> {
		return getUpcomingEvents();
	}

	async getPastEvents(): Promise<EventWithMeta[]> {
		return getPastEvents();
	}

	async getEventBySlug(slug: string): Promise<EventWithMeta | null> {
		return getEventBySlug(slug);
	}

	async getEventsByStatus(status: string): Promise<EventWithMeta[]> {
		return getEventsByStatus(status as never);
	}

	// ── Projects ───────────────────────────────────────────────

	async getAllProjects(): Promise<ProjectWithMeta[]> {
		return getAllProjects();
	}

	async getFeaturedProjects(): Promise<ProjectWithMeta[]> {
		return getFeaturedProjects();
	}

	async getProjectBySlug(slug: string): Promise<ProjectWithMeta | null> {
		return getProjectBySlug(slug);
	}

	async getProjectsByCategory(category: string): Promise<ProjectWithMeta[]> {
		return getProjectsByCategory(category as never);
	}

	// ── Members ────────────────────────────────────────────────

	async getAllMembers(): Promise<MemberWithMeta[]> {
		return getAllMembers();
	}

	async getTopMembers(limit = 10): Promise<MemberWithMeta[]> {
		return getTopMembers(limit);
	}

	async getMembersByBadge(badge: string): Promise<MemberWithMeta[]> {
		return getMembersByBadge(badge);
	}

	// ── Analytics & Stats ──────────────────────────────────────

	async getCommunityStats() {
		const [discussions, events, projects, members] = await Promise.all([
			this.getAllDiscussions().catch(() => []),
			this.getUpcomingEvents()
				.then(async (upcoming) => {
					const past = await this.getPastEvents().catch(() => []);
					return [...upcoming, ...past];
				})
				.catch(() => []),
			this.getAllProjects().catch(() => []),
			this.getAllMembers().catch(() => []),
		]);

		return {
			totalDiscussions: discussions.length,
			totalEvents: events.length,
			totalProjects: projects.length,
			totalMembers: members.length,
			activeMembers: members.length,
		};
	}
}
