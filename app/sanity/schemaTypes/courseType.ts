import { defineField, defineType } from "sanity";

export const courseType = defineType({
	name: "course",
	title: "Course",
	type: "document",
	fields: [
		defineField({ name: "title", title: "Title", type: "string" }),
		defineField({
			name: "slug",
			title: "Course ID (Slug)",
			type: "slug",
			options: { source: "title" },
			description: "Used as the on-chain course_id string",
		}),
		defineField({ name: "description", title: "Description", type: "text" }),
		defineField({ name: "image", title: "Cover Image", type: "image" }),
		defineField({
			name: "difficulty",
			title: "Difficulty",
			type: "number",
			options: { list: [1, 2, 3] },
			description: "1 = Beginner, 2 = Intermediate, 3 = Advanced",
		}),
		defineField({
			name: "duration",
			title: "Duration",
			type: "string",
			description: "Estimated time to complete the course (e.g. '12 HOURS')",
		}),
		defineField({ name: "track_id", title: "Track ID", type: "number" }),
		defineField({ name: "track_level", title: "Track Level", type: "number" }),
		defineField({
			name: "xp_per_lesson",
			title: "XP Per Lesson",
			type: "number",
			description: "Amount of XP awarded upon completion of each lesson",
		}),
		defineField({
			name: "creator_reward_xp",
			title: "Creator Reward XP",
			type: "number",
			description: "XP awarded to the creator upon finalize_course threshold",
		}),
		defineField({
			name: "min_completions_for_reward",
			title: "Min Completions For Reward",
			type: "number",
			description:
				"Minimum number of students who must complete the course before creator reward unlocks",
		}),
		defineField({
			name: "categories",
			title: "Categories",
			type: "array",
			of: [{ type: "string" }],
			options: {
				list: [
					{ title: "Solana Fundamentals", value: "fundamentals" },
					{ title: "Rust/Anchor", value: "rust-anchor" },
					{ title: "DeFi", value: "defi" },
					{ title: "Gaming", value: "gaming" },
					{ title: "Mobile", value: "mobile" },
					{ title: "Frontend", value: "frontend" },
				],
			},
			description: "Primary categories for filtering",
		}),
		defineField({
			name: "topics",
			title: "Topics/Tags",
			type: "array",
			of: [{ type: "string" }],
			description: "Granular tags (e.g., 'PDA', 'CPI', 'Token-2022')",
		}),
		defineField({
			name: "modules",
			title: "Modules",
			type: "array",
			of: [{ type: "reference", to: [{ type: "module" }] }],
		}),

		// Editorial Status (Draft -> Review Pending -> Published)
		defineField({
			name: "status",
			title: "Editorial Status",
			type: "string",
			options: {
				list: [
					{ title: "Draft", value: "draft" },
					{ title: "Review Pending", value: "review_pending" },
					{ title: "Published", value: "published" },
				],
			},
			initialValue: "draft",
		}),

		defineField({
			name: "creatorWallet",
			title: "Creator Wallet Address",
			type: "string",
			description:
				"Solana wallet address of the course creator. Used for on-chain publication.",
			readOnly: true,
		}),

		// On-chain metadata (read-only, managed by publish workflow)
		defineField({
			name: "onChainStatus",
			title: "On-Chain Status",
			type: "string",
			options: {
				list: [
					{ title: "Draft", value: "draft" },
					{ title: "Publishing", value: "publishing" },
					{ title: "Published", value: "published" },
					{ title: "Archived", value: "archived" },
				],
			},
			initialValue: "draft",
			readOnly: true,
		}),
		defineField({
			name: "coursePda",
			title: "Course PDA Address",
			type: "string",
			readOnly: true,
			description: "Solana address of the on-chain Course PDA",
		}),
		defineField({
			name: "publishedAt",
			title: "Published At",
			type: "datetime",
			readOnly: true,
		}),
		defineField({
			name: "lastSyncedAt",
			title: "Last Synced At",
			type: "datetime",
			readOnly: true,
		}),
	],
});
