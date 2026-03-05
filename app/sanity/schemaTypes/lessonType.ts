import { defineField, defineType } from "sanity";

export const lessonType = defineType({
	name: "lesson",
	title: "Lesson",
	type: "document",
	fields: [
		defineField({ name: "title", title: "Lesson Title", type: "string" }),
		defineField({
			name: "type",
			title: "Lesson Type",
			type: "string",
			options: { list: ["reading", "challenge"] },
		}),
		defineField({
			name: "duration",
			title: "Duration",
			type: "string",
			description: "Estimated time to complete this lesson (e.g. '15 mins')",
		}),
		defineField({
			name: "content",
			title: "Curriculum Content",
			type: "array",
			of: [
				{ type: "block" },
				{
					type: "image",
					fields: [{ type: "string", name: "alt", title: "Alt text" }],
				},
			],
		}),

		// Technical Challenge Fields (only visible if type is 'challenge')
		defineField({
			name: "starterCode",
			title: "Starter Code",
			type: "text",
			description: "Initial code provided to the learner",
			hidden: ({ document }) => document?.type !== "challenge",
		}),
		defineField({
			name: "solutionCode",
			title: "Solution Code",
			type: "text",
			description: "The correct solution code for comparison/reference",
			hidden: ({ document }) => document?.type !== "challenge",
		}),
		defineField({
			name: "testCases",
			title: "Test Cases",
			type: "text",
			description:
				"JSON or Script defining the validation tests for this challenge",
			hidden: ({ document }) => document?.type !== "challenge",
		}),
		defineField({
			name: "hints",
			title: "Hints",
			type: "array",
			of: [{ type: "string" }],
			description: "Sequential hints given to the user if they get stuck",
			hidden: ({ document }) => document?.type !== "challenge",
		}),
	],
});
