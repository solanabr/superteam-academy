import { createClient } from "@sanity/client";

// Manually load env if not passed via CLI
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_DEV_TOKEN;

if (!projectId || !dataset || !token) {
    console.error("Missing Sanity environment variables. Please ensure NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and SANITY_API_DEV_TOKEN are set.");
    process.exit(1);
}

const client = createClient({
    projectId,
    dataset,
    apiVersion: "2024-03-01",
    useCdn: false,
    token,
});

async function seedTestCourse() {
    console.log("🚀 Seeding test course into Sanity...");

    try {
        // 1. Create an Author
        const author = await client.create({
            _type: "author",
            name: "Solana Master",
            title: "Blockchain Educator",
        });
        console.log(`✅ Author created: ${author._id}`);

        // 2. Create the Course
        const course = await client.create({
            _type: "course",
            title: "Intro to Solana Development",
            slug: {
                _type: "slug",
                current: "intro-to-solana-dev-" + Date.now(),
            },
            description: "A comprehensive guide to building on Solana.",
            shortDescription: "Master Solana programming from scratch.",
            difficulty: "beginner",
            topic: "Development",
            tags: ["Solana", "Rust", "Web3"],
            totalXP: 500,
            enrollmentCount: 0,
            author: {
                _type: "reference",
                _ref: author._id,
            },
            milestones: [
                {
                    _type: "milestone",
                    title: "Setup & Hello World",
                    description: "Getting your environment ready.",
                    xp: 100,
                    lessons: [
                        {
                            _type: "lesson",
                            title: "Install Solana CLI",
                            type: "doc",
                            duration: "10 mins",
                        },
                        {
                            _type: "lesson",
                            title: "First Program",
                            type: "video",
                            duration: "15 mins",
                        },
                    ],
                },
            ],
        });

        console.log(`✅ Test course created: ${course.title} (ID: ${course._id})`);
        console.log("🔗 You can now see it on your /sanity-test page!");
    } catch (err) {
        console.error("❌ Error seeding test course:", err.message);
    }
}

seedTestCourse();
