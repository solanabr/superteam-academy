import swaggerJSDoc from "swagger-jsdoc";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || "5050";

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "SolLearn API Documentation",
            version: "1.0.0",
            description: "API documentation for SolLearn - Decentralized Learning Management System on Solana",
        },
        servers: [
            {
                url: `http://localhost:${PORT}/api/v1`,
                description: "Local Development Server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                // ── Primitives ─────────────────────────────────────────────────
                Lesson: {
                    type: "object",
                    properties: {
                        title: { type: "string", example: "Introduction to Solana" },
                        type: { type: "string", enum: ["video", "document", "text"] },
                        content: { type: "string", description: "Markdown content (type=text only)", nullable: true },
                        url: { type: "string", description: "URL for video or document lessons", nullable: true },
                        duration: { type: "integer", description: "Estimated minutes (videos)", nullable: true },
                        order: { type: "integer", minimum: 1, maximum: 5 },
                    },
                },
                QuizOption: {
                    type: "object",
                    properties: {
                        label: { type: "string", example: "Proof of History" },
                        isCorrect: { type: "boolean" },
                    },
                },
                QuizQuestion: {
                    type: "object",
                    properties: {
                        question: { type: "string", example: "What consensus mechanism does Solana use?" },
                        options: { type: "array", items: { $ref: "#/components/schemas/QuizOption" } },
                        explanation: { type: "string", nullable: true, description: "Shown after answering" },
                    },
                },
                CodeChallenge: {
                    type: "object",
                    properties: {
                        prompt: { type: "string" },
                        starterCode: { type: "string" },
                        language: { type: "string", enum: ["typescript", "rust", "javascript"] },
                        testCases: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    input: { type: "string" },
                                    expectedOutput: { type: "string" },
                                    description: { type: "string" },
                                },
                            },
                        },
                    },
                },
                Test: {
                    type: "object",
                    properties: {
                        title: { type: "string", example: "Solana Basics Quiz" },
                        type: { type: "string", enum: ["quiz", "code_challenge"] },
                        passThreshold: { type: "integer", example: 80, description: "Minimum score to pass (out of 100)" },
                        questions: {
                            type: "array",
                            nullable: true,
                            description: "Populated for quiz type",
                            items: { $ref: "#/components/schemas/QuizQuestion" },
                        },
                        codeChallenge: {
                            nullable: true,
                            description: "Populated for code_challenge type",
                            allOf: [{ $ref: "#/components/schemas/CodeChallenge" }],
                        },
                    },
                },
                Milestone: {
                    type: "object",
                    properties: {
                        title: { type: "string", example: "Getting Started with Solana" },
                        description: { type: "string" },
                        order: { type: "integer", minimum: 1, maximum: 5, description: "Position in the course (1–5)" },
                        xpReward: { type: "integer", example: 100, description: "XP unlocked when the full course is completed" },
                        lessons: {
                            type: "array",
                            maxItems: 5,
                            items: { $ref: "#/components/schemas/Lesson" },
                        },
                        tests: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Test" },
                        },
                    },
                },
                Course: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        slug: { type: "string" },
                        sanityId: { type: "string", nullable: true },
                        description: { type: "string" },
                        shortDescription: { type: "string", maxLength: 160 },
                        thumbnail: { type: "string" },
                        tags: { type: "array", items: { type: "string" } },
                        difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                        topic: {
                            type: "string",
                            enum: ["solana-basics", "smart-contracts", "defi", "nfts", "tokens", "web3-frontend", "security", "tooling"],
                        },
                        status: { type: "string", enum: ["draft", "published", "archived"] },
                        milestones: {
                            type: "array",
                            description: "Exactly 5 milestones",
                            items: { $ref: "#/components/schemas/Milestone" },
                        },
                        totalXP: { type: "integer", description: "Auto-calculated sum of all milestone XP rewards" },
                        duration: { type: "integer", description: "Auto-calculated total lesson duration in minutes" },
                        enrollmentCount: { type: "integer" },
                        completionCount: { type: "integer" },
                        author: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                avatar: { type: "string", nullable: true },
                                title: { type: "string", nullable: true },
                            },
                        },
                        publishedAt: { type: "string", format: "date-time", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                // ── Progress ───────────────────────────────────────────────────
                TestAttempt: {
                    type: "object",
                    properties: {
                        testId: { type: "string" },
                        score: { type: "integer", minimum: 0, maximum: 100 },
                        passed: { type: "boolean" },
                        attempts: { type: "integer" },
                        lastAttemptAt: { type: "string", format: "date-time" },
                    },
                },
                MilestoneProgress: {
                    type: "object",
                    properties: {
                        userId: { type: "string" },
                        courseId: { type: "string" },
                        milestoneId: { type: "string" },
                        milestoneOrder: { type: "integer", minimum: 1, maximum: 5 },
                        testAttempts: { type: "array", items: { $ref: "#/components/schemas/TestAttempt" } },
                        completedLessons: { type: "array", items: { type: "string" }, description: "List of completed lesson IDs" },
                        allTestsPassed: { type: "boolean" },
                        xpReward: { type: "integer" },
                        isXPUnlocked: { type: "boolean", description: "True once all 5 milestones in the course are completed" },
                        isXPClaimed: { type: "boolean" },
                        xpClaimedAt: { type: "string", format: "date-time", nullable: true },
                        completedAt: { type: "string", format: "date-time", nullable: true },
                    },
                },
                Enrollment: {
                    type: "object",
                    properties: {
                        userId: { type: "string" },
                        courseId: { type: "string" },
                        enrolledAt: { type: "string", format: "date-time" },
                        lastAccessedAt: { type: "string", format: "date-time" },
                        completedAt: { type: "string", format: "date-time", nullable: true },
                    },
                },
            },
        },
    },
    apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpecs = swaggerJSDoc(options);

export default swaggerSpecs;

