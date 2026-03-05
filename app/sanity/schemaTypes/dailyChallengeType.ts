/**
 * @fileoverview Sanity schema for standalone Daily Challenges.
 * These are independent coding challenges NOT tied to any course/module.
 * They support scheduled "daily" rotation and regular (always-available) modes.
 */
import { defineField, defineType } from "sanity";

export const dailyChallengeType = defineType({
	name: "dailyChallenge",
	title: "Daily Challenge",
	type: "document",
	fields: [
		defineField({
			name: "title",
			title: "Challenge Title",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "slug",
			title: "Slug",
			type: "slug",
			options: { source: "title" },
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "description",
			title: "Short Description",
			type: "text",
			rows: 3,
			description: "Brief summary shown on challenge cards",
		}),
		defineField({
			name: "difficulty",
			title: "Difficulty",
			type: "number",
			options: { list: [1, 2, 3] },
			description: "1 = Beginner, 2 = Intermediate, 3 = Advanced",
			initialValue: 1,
		}),
		defineField({
			name: "category",
			title: "Category",
			type: "string",
			options: {
				list: [
					{ title: "Solana Fundamentals", value: "fundamentals" },
					{ title: "Rust/Anchor", value: "rust-anchor" },
					{ title: "DeFi", value: "defi" },
					{ title: "Frontend/Web3", value: "frontend" },
					{ title: "Security", value: "security" },
					{ title: "Token Extensions", value: "token-extensions" },
				],
			},
		}),
		defineField({
			name: "xpReward",
			title: "XP Reward",
			type: "number",
			description: "XP awarded on successful completion",
			initialValue: 50,
		}),
		defineField({
			name: "scheduledDate",
			title: "Scheduled Date",
			type: "date",
			description:
				"The date this challenge appears as the 'Daily Challenge'. Leave empty for always-available regular challenges.",
		}),
		defineField({
			name: "content",
			title: "Challenge Instructions",
			type: "array",
			of: [
				{ type: "block" },
				{
					type: "image",
					fields: [{ type: "string", name: "alt", title: "Alt text" }],
				},
			],
			description: "Full challenge instructions in rich text (Portable Text)",
		}),
		defineField({
			name: "starterCode",
			title: "Starter Code",
			type: "text",
			description: "Pre-populated code the learner starts with",
		}),
		defineField({
			name: "solutionCode",
			title: "Solution Code",
			type: "text",
			description: "Reference solution for validation",
		}),
		defineField({
			name: "testCases",
			title: "Test Cases",
			type: "text",
			description:
				'JSON array of test cases, e.g. [{"name":"Test 1","description":"Should derive PDA correctly"}]',
		}),
		defineField({
			name: "hints",
			title: "Hints",
			type: "array",
			of: [{ type: "string" }],
			description: "Progressive hints shown when learner is stuck",
		}),
		defineField({
			name: "isActive",
			title: "Active",
			type: "boolean",
			initialValue: true,
			description: "Whether this challenge is visible to learners",
		}),
	],
	preview: {
		select: {
			title: "title",
			subtitle: "category",
			date: "scheduledDate",
		},
		prepare({ title, subtitle, date }) {
			return {
				title: title || "Untitled Challenge",
				subtitle: date
					? `${subtitle || "—"} · Daily: ${date}`
					: `${subtitle || "—"} · Regular`,
			};
		},
	},
});
