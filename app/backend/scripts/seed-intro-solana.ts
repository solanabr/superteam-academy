import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Course } from "../src/models/courses";

const courseData = {
    title: "Introduction to Solana Ecosystem",
    slug: "introduction-to-solana-ecosystem",
    description: "A comprehensive guide to understanding the Solana blockchain, its architecture, and the thriving ecosystem built upon it.",
    shortDescription: "Learn the fundamentals of Solana, from its unique Proof of History consensus to its core ecosystem components.",
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2832&ixlib=rb-4.0.3", // Placeholder, user can update via upload
    tags: ["solana", "blockchain", "beginner", "ecosystem"],
    difficulty: "beginner",
    topic: "solana-basics",
    status: "published",
    author: {
        name: "SolLearn Team",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=1760&ixlib=rb-4.0.3",
        title: "Core Educators"
    },
    milestones: [
        {
            title: "The Solana Blockchain",
            description: "Understand the core architecture of Solana, including Proof of History (PoH) and how it achieves high throughput.",
            order: 1,
            xpReward: 200,
            resources: [
                {
                    title: "Introduction to Solana",
                    type: "text",
                    content: "Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale today.\n\n### Key Features\n- **High Throughput**: 50,000+ transactions per second.\n- **Low Latency**: ~400ms block times.\n- **Low Cost**: Average transaction fee is <$0.01.",
                    order: 1
                },
                {
                    title: "Proof of History (PoH)",
                    type: "text",
                    content: "Proof of History is a high-frequency Verifiable Delay Function. It allows validators to create a historical record that proves that an event has occurred at a specific moment in time.",
                    order: 2
                },
                {
                    title: "Solana Architecture Overview",
                    type: "text",
                    content: "Learn about the 8 core innovations that make Solana work: Proof of History, Tower BFT, Gulf Stream, Sealevel, Pipelining, Cloudbreak, Archivers, and Turbine.",
                    order: 3
                }
            ],
            tests: [
                {
                    title: "Solana Basics Quiz",
                    type: "quiz",
                    passThreshold: 80,
                    questions: [
                        {
                            question: "What is Solana's core innovation for time synchronization?",
                            options: [
                                { label: "Proof of History", isCorrect: true },
                                { label: "Proof of Stake", isCorrect: false },
                                { label: "Proof of Work", isCorrect: false }
                            ],
                            explanation: "Proof of History allows the network to agree on the passage of time without needing to communicate."
                        },
                        {
                            question: "Solana block times are approximately how long?",
                            options: [
                                { label: "10 minutes", isCorrect: false },
                                { label: "~400ms", isCorrect: true },
                                { label: "15 seconds", isCorrect: false }
                            ],
                            explanation: "Solana aims for sub-second block times, typically around 400 milliseconds."
                        }
                    ]
                }
            ]
        },
        {
            title: "Accounts & Transactions",
            description: "Learn about Solana's unique account model and how transactions are structured and executed.",
            order: 2,
            xpReward: 200,
            resources: [
                {
                    title: "Solana's Account Model",
                    type: "text",
                    content: "Everything on Solana is an account. Accounts can store data (like metadata) or be executable programs.",
                    order: 1
                },
                {
                    title: "Transaction Structure",
                    type: "text",
                    content: "A Solana transaction consists of a header, an array of account addresses, a recent blockhash, and one or more instructions.",
                    order: 2
                }
            ],
            tests: [
                {
                    title: "Accounts & TX Quiz",
                    type: "quiz",
                    passThreshold: 80,
                    questions: [
                        {
                            question: "In Solana, what can an account represent?",
                            options: [
                                { label: "Only a user wallet", isCorrect: false },
                                { label: "A user wallet, a program, or a data storage container", isCorrect: true },
                                { label: "Only an NFT", isCorrect: false }
                            ],
                            explanation: "Solana generalizes the concept of accounts to handle everything from user balances to on-chain code."
                        }
                    ]
                }
            ]
        },
        {
            title: "The Solana Ecosystem",
            description: "Explore the different primitives that make up the Solana ecosystem, including Wallets, DeFi, and NFTs.",
            order: 3,
            xpReward: 200,
            resources: [
                {
                    title: "SPL Tokens & Wallets",
                    type: "text",
                    content: "The Solana Program Library (SPL) defines the standards for tokens on Solana. Popular wallets include Phantom and Solflare.",
                    order: 1
                },
                {
                    title: "DeFi on Solana",
                    type: "text",
                    content: "Learn about decentralized exchanges (DEXs) like Jupiter and Raydium, and lending protocols like Kamino.",
                    order: 2
                }
            ],
            tests: [
                {
                    title: "Ecosystem Quiz",
                    type: "quiz",
                    passThreshold: 80,
                    questions: [
                        {
                            question: "Which of these is a popular Solana wallet?",
                            options: [
                                { label: "Metamask", isCorrect: false },
                                { label: "Phantom", isCorrect: true },
                                { label: "Keplr", isCorrect: false }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            title: "Building on Solana",
            description: "An overview of the developer experience, programs, and the Anchor framework.",
            order: 4,
            xpReward: 200,
            resources: [
                {
                    title: "Solana Programs (Smart Contracts)",
                    type: "text",
                    content: "Solana uses Rust, C, and C++ for writing on-chain code called programs. These are executed by the Sealevel runtime.",
                    order: 1
                },
                {
                    title: "Anchor Framework",
                    type: "text",
                    content: "Anchor is a framework for Solana's Sealevel runtime providing several developer tools for writing smart contracts.",
                    order: 2
                }
            ],
            tests: [
                {
                    title: "Development Quiz",
                    type: "quiz",
                    passThreshold: 80,
                    questions: [
                        {
                            question: "Which language is primarily used for Solana programs?",
                            options: [
                                { label: "Solidity", isCorrect: false },
                                { label: "Rust", isCorrect: true },
                                { label: "Python", isCorrect: false }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            title: "Staying Safe in Web3",
            description: "Crucial security practices for users and builders in the Solana ecosystem.",
            order: 5,
            xpReward: 200,
            resources: [
                {
                    title: "Wallet Security Best Practices",
                    type: "text",
                    content: "Never share your seed phrase, use hardware wallets, and always verify transaction details before signing.",
                    order: 1
                },
                {
                    title: "Avoiding Common Scams",
                    type: "text",
                    content: "Be wary of 'airdrops' that ask for signatures on fishy sites, and always use official links for dApps.",
                    order: 2
                }
            ],
            tests: [
                {
                    title: "Security Quiz",
                    type: "quiz",
                    passThreshold: 80,
                    questions: [
                        {
                            question: "Who should you share your seed phrase with?",
                            options: [
                                { label: "Customer Support", isCorrect: false },
                                { label: "Nobody", isCorrect: true },
                                { label: "Your best friend", isCorrect: false }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

async function seed() {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/sollearn";
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const course = await Course.findOneAndUpdate(
            { slug: courseData.slug },
            courseData,
            { upsert: true, new: true, runValidators: true }
        );

        console.log(`✅ Course "${course.title}" seeded successfully!`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seed();
