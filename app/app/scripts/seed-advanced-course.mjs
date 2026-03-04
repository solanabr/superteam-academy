import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_DEV_TOKEN;

if (!projectId || !dataset || !token) {
    console.error("Missing Sanity environment variables.");
    process.exit(1);
}

const client = createClient({
    projectId,
    dataset,
    apiVersion: "2024-03-01",
    useCdn: false,
    token,
});

async function seedAdvancedCourse() {
    console.log("🚀 Seeding ADVANCED test course into Sanity...");

    try {
        // 1. Create a Track
        const track = await client.create({
            _type: "track",
            title: "Solana Core",
            description: "Foundational concepts of the Solana blockchain.",
            color: "#9945FF",
            icon: "Cpu",
        });
        console.log(`✅ Track created: ${track.title}`);

        // 2. Create an Author (Reuse or create new)
        const author = await client.create({
            _type: "author",
            name: "Solana Guru",
            title: "Lead Developer",
        });
        console.log(`✅ Author created: ${author.name}`);

        // 3. Create the Course with all advanced fields
        const course = await client.create({
            _type: "course",
            title: "Solana Smart Contract Deep Dive",
            slug: {
                _type: "slug",
                current: "solana-deep-dive-" + Date.now(),
            },
            description: "Learn how to build high-performance smart contracts on Solana.",
            shortDescription: "The ultimate guide to Solana programs.",
            difficulty: "advanced",
            topic: "Smart Contracts",
            duration: "10h 45m",
            totalXP: 1500,
            tags: ["Solana", "Rust", "Anchor", "Smart Contracts"],
            enrollmentCount: 120,
            track: {
                _type: "reference",
                _ref: track._id,
            },
            author: {
                _type: "reference",
                _ref: author._id,
            },
            milestones: [
                {
                    _type: "milestone",
                    title: "Module 1: Account Model",
                    description: "Understanding how data is stored on Solana.",
                    xp: 300,
                    lessons: [
                        {
                            _type: "lesson",
                            title: "What are Accounts?",
                            type: "video",
                            duration: "12 mins",
                            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        },
                        {
                            _type: "lesson",
                            title: "PDA Mastery",
                            type: "reading",
                            duration: "20 mins",
                            content: [
                                {
                                    _type: "block",
                                    children: [{ _type: "span", text: "Program Derived Addresses (PDAs) are critical for Solana dev." }],
                                    markDefs: [],
                                    style: "normal",
                                },
                                {
                                    _type: "code",
                                    language: "rust",
                                    filename: "pda_example.rs",
                                    code: "let (pda, bump) = Pubkey::find_program_address(&[seed], program_id);",
                                },
                            ],
                        },
                        {
                            _type: "lesson",
                            title: "Challenge: Find the PDA",
                            type: "challenge",
                            duration: "45 mins",
                            challenge: {
                                instructions: [
                                    {
                                        _type: "block",
                                        children: [{ _type: "span", text: "In this challenge, you need to find the PDA for the given seeds." }],
                                        markDefs: [],
                                        style: "normal",
                                    }
                                ],
                                initialCode: {
                                    _type: "code",
                                    language: "rust",
                                    code: "fn main() {\n    // Write your code here\n}",
                                },
                                solution: {
                                    _type: "code",
                                    language: "rust",
                                    code: "fn main() {\n    let seeds = b\"user_data\";\n    let program_id = Pubkey::default();\n    let (pda, _) = Pubkey::find_program_address(&[seeds], &program_id);\n    println!(\"{:?}\", pda);\n}",
                                },
                            },
                        },
                    ],
                },
            ],
        });

        console.log(`✅ Advanced course created: ${course.title} (ID: ${course._id})`);
        console.log("🔗 Head to your /sanity-test page to see the new data structure!");
    } catch (err) {
        console.error("❌ Error seeding advanced course:", err.message);
        if (err.response) {
            console.error("Response data:", JSON.stringify(err.response.body, null, 2));
        }
    }
}

seedAdvancedCourse();
