import mongoose from "mongoose";
import dotenv from "dotenv";
import { Course } from "./models/courses";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI is missing");
    process.exit(1);
}

const seedCourse = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Clear existing courses for idempotency
        await Course.deleteMany({});
        console.log("Cleared existing courses");

        const introCourse = {
            title: "Intro to Solana",
            slug: "intro-to-solana",
            description: "Learn the fundamentals of Solana blockchain — accounts, transactions, and the runtime model. This course takes you from zero knowledge to confidently reading and reasoning about on-chain data.",
            shortDescription: "Learn Solana fundamentals from zero to hero.",
            difficulty: "beginner",
            topic: "solana-basics",
            status: "published",
            author: {
                name: "Alex Rivera",
                role: "Solana Core Contributor"
            },
            milestones: [
                {
                    title: "Blockchain Basics",
                    description: "Understand what makes Solana unique",
                    order: 1,
                    xpReward: 30,
                    resources: [
                        { title: "What is Solana?", type: "video", duration: 8, order: 1 },
                        { title: "Accounts Model", type: "document", duration: 12, order: 2 },
                    ],
                    tests: [
                        {
                            title: "Knowledge Check",
                            type: "quiz",
                            passThreshold: 80,
                            questions: [
                                { question: "What is Solana?", options: [{ label: "A blockchain", isCorrect: true }] }
                            ]
                        }
                    ]
                },
                {
                    title: "Transactions Deep Dive",
                    description: "Master transaction anatomy and lifecycle",
                    order: 2,
                    xpReward: 50,
                    resources: [
                        { title: "Transaction Structure", type: "video", duration: 15, order: 1 },
                        { title: "Instructions & Programs", type: "document", duration: 10, order: 2 }
                    ],
                    tests: [
                        {
                            title: "Build a Transaction",
                            type: "code_challenge",
                            passThreshold: 80,
                            codeChallenge: {
                                prompt: "Create a transfer instruction",
                                starterCode: "// Write code here",
                                language: "typescript",
                                testCases: [
                                    { input: "1", expectedOutput: "1", description: "Test case 1" }
                                ]
                            }
                        }
                    ]
                },
                {
                    title: "Programs & Runtime",
                    description: "How programs execute on Solana",
                    order: 3,
                    xpReward: 50,
                    resources: [
                        { title: "Program Lifecycle", type: "video", duration: 12, order: 1 },
                        { title: "Cross-Program Invocations", type: "document", duration: 14, order: 2 }
                    ],
                    tests: [
                        {
                            title: "Runtime Challenge",
                            type: "quiz",
                            passThreshold: 80,
                            questions: [
                                { question: "What is CPI?", options: [{ label: "Cross-Program Invocation", isCorrect: true }] }
                            ]
                        }
                    ]
                },
                {
                    title: "Final Project",
                    description: "Apply everything you have learned",
                    order: 4,
                    xpReward: 70,
                    resources: [
                        { title: "Project Brief", type: "document", duration: 5, order: 1 }
                    ],
                    tests: [
                        {
                            title: "Build & Deploy",
                            type: "code_challenge",
                            passThreshold: 80,
                            codeChallenge: {
                                prompt: "Deploy program",
                                starterCode: "// Code...",
                                language: "rust",
                                testCases: [
                                    { input: "1", expectedOutput: "1", description: "Test" }
                                ]
                            }
                        }
                    ]
                },
                {
                    title: "Graduation",
                    description: "Claim your certificate",
                    order: 5,
                    xpReward: 100,
                    resources: [
                        { title: "Next Steps", type: "document", duration: 5, order: 1 }
                    ],
                    tests: []
                }
            ]
        };

        const course2 = {
            title: "Smart Contract Development",
            slug: "smart-contracts",
            description: "Write your first Solana program.",
            shortDescription: "Intro to Anchor",
            difficulty: "intermediate",
            topic: "smart-contracts",
            status: "published",
            author: { name: "Sarah" },
            milestones: Array.from({ length: 5 }).map((_, i) => ({
                title: `Milestone ${i + 1}`, order: i + 1, xpReward: 50, resources: [], tests: []
            }))
        };

        const course3 = {
            title: "DeFi on Solana",
            slug: "defi-solana",
            description: "Learn DeFi",
            shortDescription: "DeFi basics",
            difficulty: "advanced",
            topic: "defi",
            status: "published",
            author: { name: "Mike" },
            milestones: Array.from({ length: 5 }).map((_, i) => ({
                title: `Milestone ${i + 1}`, order: i + 1, xpReward: 50, resources: [], tests: []
            }))
        };

        const course4 = {
            title: "Solana Security",
            slug: "solana-security",
            description: "Learn Security",
            shortDescription: "Security basics",
            difficulty: "advanced",
            topic: "security",
            status: "published",
            author: { name: "Sec" },
            milestones: Array.from({ length: 5 }).map((_, i) => ({
                title: `Milestone ${i + 1}`, order: i + 1, xpReward: 50, resources: [], tests: []
            }))
        };

        await Course.create([introCourse, course2, course3, course4]);
        console.log("Courses seeded successfully.");

    } catch (error) {
        console.error("Seeding error:", error);
    } finally {
        mongoose.connection.close();
    }
};

seedCourse();
