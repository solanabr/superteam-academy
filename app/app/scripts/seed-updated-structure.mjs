import { createClient } from "@sanity/client";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load env manually
function loadEnv() {
    const envPath = path.join(__dirname, "../.env.local");
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        envContent.split("\n").forEach((line) => {
            const [key, ...valueParts] = line.split("=");
            if (key && valueParts.length > 0) {
                const value = valueParts.join("=").trim().replace(/^["']|["']$/g, '');
                process.env[key.trim()] = value;
            }
        });
    }
}

loadEnv();

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

async function seedData() {
    console.log("🚀 Seeding updated structure and demo data into Sanity...");

    try {
        // 1. Create a Track
        const track = await client.create({
            _type: "track",
            title: "Solana Mastery",
            description: "From basics to advanced Solana development.",
            color: "#14F195",
            icon: "Zap",
        });
        console.log(`✅ Track created: ${track._id}`);

        // 2. Create an Author
        const author = await client.create({
            _type: "author",
            name: "Antigravity Guru",
            title: "Web3 Engineering Lead",
        });
        console.log(`✅ Author created: ${author._id}`);

        // 3. Create Lessons for Milestone 1
        const lesson1a = await client.create({
            _type: "lesson",
            title: "Exploring the Solana Ecosystem",
            type: "video",
            order: 1,
            duration: 12,
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        });
        const lesson1b = await client.create({
            _type: "lesson",
            title: "Solana vs. Other Blockchains",
            type: "reading",
            order: 2,
            duration: 15,
            content: [
                {
                    _type: "block",
                    children: [{ _type: "span", text: "Solana is known for its high throughput and low fees." }],
                    markDefs: [],
                    style: "normal",
                },
            ],
        });

        // 4. Create Lessons for Milestone 2
        const lesson2a = await client.create({
            _type: "lesson",
            title: "Setting Up Your Rust Environment",
            type: "reading",
            order: 1,
            duration: 20,
            content: [
                {
                    _type: "block",
                    children: [{ _type: "span", text: "You need to install rustup, cargo, and the Solana CLI." }],
                    markDefs: [],
                    style: "normal",
                },
            ],
        });
        const lesson2b = await client.create({
            _type: "lesson",
            title: "Hello World on Solana",
            type: "challenge",
            order: 2,
            duration: 45,
            challenge: {
                instructions: [
                    {
                        _type: "block",
                        children: [{ _type: "span", text: "Write your first program that greets the caller." }],
                        markDefs: [],
                        style: "normal",
                    }
                ],
                initialCode: {
                    _type: "code",
                    language: "rust",
                    code: "pub fn handler() {}",
                },
                solution: {
                    _type: "code",
                    language: "rust",
                    code: "pub fn handler(ctx: Context<Hello>) -> Result<()> {\n    msg!(\"Hello World\");\n    Ok(())\n}",
                },
            },
        });

        // 5. Create Milestones
        const milestone1 = await client.create({
            _type: "milestone",
            title: "Fundamentals",
            description: "Theoretical basis of Solana.",
            order: 1,
            xpReward: 200,
            lessons: [
                { _type: "reference", _ref: lesson1a._id },
                { _type: "reference", _ref: lesson1b._id },
            ],
        });

        const milestone2 = await client.create({
            _type: "milestone",
            title: "Your First Program",
            description: "Getting hands-on with Rust and Anchor.",
            order: 2,
            xpReward: 500,
            lessons: [
                { _type: "reference", _ref: lesson2a._id },
                { _type: "reference", _ref: lesson2b._id },
            ],
        });

        // 6. Create the Course
        const course = await client.create({
            _type: "course",
            title: "Solana Onchain Academy",
            slug: {
                _type: "slug",
                current: "solana-onchain-academy-" + Date.now(),
            },
            description: "A deep dive into Solana development with modular lessons.",
            shortDescription: "Master Solana through building.",
            difficulty: "intermediate",
            topic: "Development",
            tags: ["Solana", "Rust", "Intermediate"],
            duration: 120,
            totalXP: 700,
            enrollmentCount: 42,
            track: {
                _type: "reference",
                _ref: track._id,
            },
            author: {
                _type: "reference",
                _ref: author._id,
            },
            milestones: [
                { _type: "reference", _ref: milestone1._id },
                { _type: "reference", _ref: milestone2._id },
            ],
        });

        console.log(`✅ Fully seeded! Course: ${course.title} (ID: ${course._id})`);
    } catch (err) {
        console.error("❌ Error seeding data:", err);
    }
}

seedData();
