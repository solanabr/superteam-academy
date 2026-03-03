import { defineField, defineType } from "sanity";

export const quizType = defineType({
    name: "quiz",
    title: "Quiz",
    type: "document",
    fields: [
        defineField({
            name: "title",
            title: "Title",
            type: "string",
            validation: (r) => r.required(),
            initialValue: "Module Quiz",
        }),
        defineField({
            name: "passingScore",
            title: "Passing Score (%)",
            type: "number",
            validation: (r) => r.min(0).max(100),
            initialValue: 70,
        }),
        defineField({
            name: "questions",
            title: "Questions",
            type: "array",
            of: [
                {
                    type: "object",
                    fields: [
                        { name: "question", type: "text", title: "Question", validation: r => r.required() },
                        {
                            name: "options",
                            type: "array",
                            title: "Options",
                            of: [{ type: "string" }],
                            validation: r => r.min(2).max(6).required(),
                        },
                        {
                            name: "correctIndex",
                            type: "number",
                            title: "Correct Answer Index (0-based)",
                            validation: r => r.min(0).required(),
                        },
                        {
                            name: "explanation",
                            type: "text",
                            title: "Explanation (Optional)",
                            description: "Shown after the user submits answers.",
                        },
                    ],
                },
            ],
            validation: r => r.min(1).required(),
        }),
    ],
});
