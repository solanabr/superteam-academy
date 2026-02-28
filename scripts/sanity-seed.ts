/**
 * Sanity seed data — run with: npx sanity dataset import sanity/seed.ndjson production
 * Or use the Sanity CLI: npx sanity exec sanity/seed.ts --with-user-token
 */

import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2025-02-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const courses = [
  {
    _type: 'course',
    _id: 'course-intro-solana',
    title: 'Introduction to Solana',
    slug: { _type: 'slug', current: 'intro-solana' },
    description: 'Learn the fundamentals of the Solana blockchain, its architecture, and key concepts.',
    level: 'Beginner',
    track: 'Solana',
    xp_reward: 1000,
    lesson_count: 8,
    duration: '4 hours',
    thumbnail_color: 'from-purple-600 to-indigo-600',
    thumbnail_icon: 'graduation-cap',
    enrollments: 456,
    tags: ['solana', 'blockchain', 'beginner'],
    objectives: ['Understand Solana architecture', 'Set up a development environment', 'Create your first transaction'],
    prerequisites: ['Basic programming knowledge'],
    order: 1,
  },
  {
    _type: 'course',
    _id: 'course-anchor-basics',
    title: 'Anchor Fundamentals',
    slug: { _type: 'slug', current: 'anchor-basics' },
    description: 'Master the Anchor framework for building Solana smart contracts.',
    level: 'Intermediate',
    track: 'Anchor',
    xp_reward: 1500,
    lesson_count: 10,
    duration: '6 hours',
    thumbnail_color: 'from-green-600 to-teal-600',
    thumbnail_icon: 'code',
    enrollments: 312,
    tags: ['anchor', 'rust', 'smart-contracts'],
    objectives: ['Write Anchor programs', 'Test with Bankrun', 'Deploy to devnet'],
    prerequisites: ['Basic Rust', 'Introduction to Solana'],
    order: 2,
  },
  {
    _type: 'course',
    _id: 'course-defi-solana',
    title: 'DeFi on Solana',
    slug: { _type: 'slug', current: 'defi-solana' },
    description: 'Build decentralized finance applications on Solana.',
    level: 'Advanced',
    track: 'DeFi',
    xp_reward: 2000,
    lesson_count: 12,
    duration: '8 hours',
    thumbnail_color: 'from-orange-600 to-red-600',
    thumbnail_icon: 'trending-up',
    enrollments: 198,
    tags: ['defi', 'amm', 'lending', 'solana'],
    objectives: ['Build an AMM', 'Implement lending protocol', 'Understand oracle integration'],
    prerequisites: ['Anchor Fundamentals', 'DeFi concepts'],
    order: 3,
  },
  {
    _type: 'course',
    _id: 'course-nft-solana',
    title: 'NFTs on Solana',
    slug: { _type: 'slug', current: 'nft-solana' },
    description: 'Create, mint, and manage NFT collections using Metaplex.',
    level: 'Intermediate',
    track: 'NFTs',
    xp_reward: 1200,
    lesson_count: 8,
    duration: '5 hours',
    thumbnail_color: 'from-pink-600 to-rose-600',
    thumbnail_icon: 'image',
    enrollments: 267,
    tags: ['nft', 'metaplex', 'digital-art'],
    objectives: ['Mint NFTs', 'Build collections', 'Implement royalties'],
    prerequisites: ['Introduction to Solana'],
    order: 4,
  },
  {
    _type: 'course',
    _id: 'course-token-extensions',
    title: 'Token Extensions',
    slug: { _type: 'slug', current: 'token-extensions' },
    description: 'Master SPL Token 2022 and its powerful extensions.',
    level: 'Advanced',
    track: 'Solana',
    xp_reward: 1800,
    lesson_count: 10,
    duration: '7 hours',
    thumbnail_color: 'from-cyan-600 to-blue-600',
    thumbnail_icon: 'puzzle',
    enrollments: 145,
    tags: ['spl-token', 'token-2022', 'extensions'],
    objectives: ['Transfer hooks', 'Confidential transfers', 'Interest-bearing tokens'],
    prerequisites: ['Anchor Fundamentals'],
    order: 5,
  },
];

async function seed() {
  const transaction = client.transaction();
  for (const course of courses) {
    transaction.createOrReplace(course);
  }
  const result = await transaction.commit();
  console.log(`Seeded ${courses.length} courses. Transaction ID: ${result.transactionId}`);
}

seed().catch(console.error);
