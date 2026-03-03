/**
 * Mock on-chain Course objects matching the SanityCourse data.
 *
 * These simulate the on-chain Course PDA data fetched from /api/courses.
 * courseId maps to the SanityCourse's onChainCourseId.
 *
 * Only loaded when NEXT_PUBLIC_USE_MOCK_DATA=true.
 */

import type { Course } from '@/context/types/course';

export const MOCK_ON_CHAIN_COURSES: Course[] = [
    {
        courseId: 'mock-course-1',
        coursePda: 'MockPda1111111111111111111111111111111111111',
        creator: '11111111111111111111111111111111',
        contentTxId: [],
        version: 1,
        lessonCount: 4,
        difficulty: 1, // Beginner
        xpPerLesson: 100,
        trackId: 1, // Solana Developer
        trackLevel: 1,
        prerequisite: null,
        creatorRewardXp: 50,
        minCompletionsForReward: 10,
        totalCompletions: 247,
        totalEnrollments: 1832,
        isActive: true,
        createdAt: Math.floor(new Date('2026-01-15').getTime() / 1000),
        updatedAt: Math.floor(new Date('2026-03-01').getTime() / 1000),
        bump: 255,
        // Enriched by CMS merge in useActiveCourses:
        title: 'Intro to Solana Development',
        description: 'Start your Solana journey! Learn the fundamentals of blockchain development, write your first Rust program, and understand the account model.',
        thumbnail: undefined,
    },
    {
        courseId: 'mock-course-2',
        coursePda: 'MockPda2222222222222222222222222222222222222',
        creator: '22222222222222222222222222222222',
        contentTxId: [],
        version: 1,
        lessonCount: 4,
        difficulty: 2, // Intermediate
        xpPerLesson: 150,
        trackId: 2, // DeFi Specialist
        trackLevel: 1,
        prerequisite: null,
        creatorRewardXp: 75,
        minCompletionsForReward: 10,
        totalCompletions: 89,
        totalEnrollments: 654,
        isActive: true,
        createdAt: Math.floor(new Date('2026-02-01').getTime() / 1000),
        updatedAt: Math.floor(new Date('2026-03-01').getTime() / 1000),
        bump: 254,
        title: 'DeFi Fundamentals on Solana',
        description: 'Master decentralized finance on Solana. Learn about SPL tokens, AMMs, liquidity pools, and build a token swap calculator.',
        thumbnail: undefined,
    },
];
