import { defineField, defineType } from "sanity";

export const moduleType = defineType({
	name: "module",
	title: "Module",
	type: "document",
	fields: [
		defineField({ name: "title", title: "Title", type: "string" }),
		defineField({ name: "order", title: "Order Index", type: "number" }),
		defineField({
			name: "lessons",
			title: "Lessons",
			type: "array",
			of: [{ type: "reference", to: [{ type: "lesson" }] }],
		}),
	],
});
