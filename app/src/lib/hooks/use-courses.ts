'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { fetchAllCourses, fetchEnrollment, countCompletedLessons, getCompletedLessonIndices } from '@/lib/solana';
import type { Course, LessonProgress } from '@/types';

// Demo courses for when on-chain data isn't available
const DEMO_COURSES: Course[] = [
  {
    publicKey: 'demo1',
    courseId: 'anchor-101',
    title: 'Introduction to Anchor',
    description: 'Learn the fundamentals of building Solana programs with the Anchor framework. From PDAs to CPIs.',
    creator: 'ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    lessonCount: 10,
    difficulty: 1,
    xpPerLesson: 100,
    totalXp: 1500,
    trackId: 1,
    trackLevel: 1,
    isActive: true,
    totalCompletions: 42,
    prerequisite: null,
    tags: ['anchor', 'rust', 'pda'],
  },
  {
    publicKey: 'demo2',
    courseId: 'token-2022',
    title: 'Token-2022 Extensions',
    description: 'Master Token-2022 extensions including transfer hooks, permanent delegates, and non-transferable tokens.',
    creator: 'ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    lessonCount: 8,
    difficulty: 2,
    xpPerLesson: 150,
    totalXp: 1800,
    trackId: 1,
    trackLevel: 2,
    isActive: true,
    totalCompletions: 18,
    prerequisite: 'anchor-101',
    tags: ['token-2022', 'extensions', 'spl'],
  },
  {
    publicKey: 'demo3',
    courseId: 'metaplex-core',
    title: 'Metaplex Core NFTs',
    description: 'Build with Metaplex Core: create collections, mint NFTs, add plugins for royalties and freezing.',
    creator: 'ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    lessonCount: 12,
    difficulty: 2,
    xpPerLesson: 125,
    totalXp: 2250,
    trackId: 3,
    trackLevel: 1,
    isActive: true,
    totalCompletions: 27,
    prerequisite: null,
    tags: ['metaplex', 'nft', 'core'],
  },
  {
    publicKey: 'demo4',
    courseId: 'defi-amm',
    title: 'Building a DeFi AMM',
    description: 'Design and implement an automated market maker on Solana. Covers constant product, liquidity pools, and swaps.',
    creator: 'ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    lessonCount: 15,
    difficulty: 3,
    xpPerLesson: 200,
    totalXp: 4500,
    trackId: 2,
    trackLevel: 1,
    isActive: true,
    totalCompletions: 8,
    prerequisite: 'anchor-101',
    tags: ['defi', 'amm', 'liquidity'],
  },
  {
    publicKey: 'demo5',
    courseId: 'solana-basics',
    title: 'Solana Fundamentals',
    description: 'Understand the Solana runtime, accounts model, transactions, and the programming model from the ground up.',
    creator: 'ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    lessonCount: 6,
    difficulty: 1,
    xpPerLesson: 75,
    totalXp: 675,
    trackId: 1,
    trackLevel: 0,
    isActive: true,
    totalCompletions: 156,
    prerequisite: null,
    tags: ['solana', 'basics', 'accounts'],
  },
  {
    publicKey: 'demo6',
    courseId: 'gaming-sdk',
    title: 'Solana Gaming with Unity',
    description: 'Integrate Solana into Unity games. Player wallets, on-chain game state, and NFT items.',
    creator: 'ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    lessonCount: 10,
    difficulty: 3,
    xpPerLesson: 175,
    totalXp: 2625,
    trackId: 4,
    trackLevel: 1,
    isActive: true,
    totalCompletions: 5,
    prerequisite: 'solana-basics',
    tags: ['gaming', 'unity', 'nft'],
  },
];

export function useCourses() {
  const { connection } = useConnection();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const onChainCourses = await fetchAllCourses(connection);

        if (!cancelled) {
          if (onChainCourses.length > 0) {
            setCourses(
              onChainCourses
                .filter((c) => c.account.isActive)
                .map((c) => ({
                  publicKey: c.publicKey.toBase58(),
                  courseId: c.account.courseId,
                  title: c.account.courseId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                  description: '',
                  creator: c.account.creator.toBase58(),
                  lessonCount: c.account.lessonCount,
                  difficulty: c.account.difficulty as 1 | 2 | 3,
                  xpPerLesson: c.account.xpPerLesson,
                  totalXp: c.account.xpPerLesson * c.account.lessonCount + Math.floor((c.account.xpPerLesson * c.account.lessonCount) / 2),
                  trackId: c.account.trackId,
                  trackLevel: c.account.trackLevel,
                  isActive: c.account.isActive,
                  totalCompletions: c.account.totalCompletions,
                  prerequisite: c.account.prerequisite,
                }))
            );
          } else {
            setCourses(DEMO_COURSES);
          }
        }
      } catch {
        if (!cancelled) setCourses(DEMO_COURSES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [connection]);

  return { courses, loading };
}

export function useEnrollmentProgress(courseId: string) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const enrollment = await fetchEnrollment(connection, courseId, publicKey);
      if (enrollment) {
        const completedIndices = getCompletedLessonIndices(enrollment.lessonFlags, 256);
        setProgress({
          courseId,
          completedLessons: completedIndices,
          totalLessons: 0, // needs course data
          completedAt: enrollment.completedAt?.toNumber() ?? null,
          enrolledAt: enrollment.enrolledAt.toNumber(),
          progressPercent: 0,
        });
      } else {
        setProgress(null);
      }
    } catch {
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, courseId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { progress, loading, refresh };
}
