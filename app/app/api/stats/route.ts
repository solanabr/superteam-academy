import { NextResponse } from 'next/server';
import { MOCK_COURSES } from '@/lib/mock-data';

export async function GET() {
  const totalCourses = MOCK_COURSES.length;
  const totalLessons = MOCK_COURSES.reduce((sum, c) => sum + c.lesson_count, 0);
  const totalEnrollments = MOCK_COURSES.reduce((sum, c) => sum + c.enrollments, 0);
  const tracks = [...new Set(MOCK_COURSES.map((c) => c.track))];
  const levels = [...new Set(MOCK_COURSES.map((c) => c.level))];
  const avgXpReward = Math.round(MOCK_COURSES.reduce((s, c) => s + c.xp_reward, 0) / totalCourses);

  return NextResponse.json({
    platform: {
      name: 'Superteam Academy',
      version: '1.0.0',
      locales: ['pt-BR', 'en', 'es'],
      network: process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? 'devnet',
    },
    courses: {
      total: totalCourses,
      totalLessons,
      tracks: tracks.length,
      trackList: tracks,
      levels: levels.length,
      levelList: levels,
      avgXpReward,
    },
    community: {
      totalEnrollments,
      supportedLanguages: 3,
    },
    features: [
      'on-chain-credentials',
      'gamification',
      'interactive-challenges',
      'monaco-editor',
      'pwa-offline',
      'i18n-3-locales',
      'course-reviews',
      'community-forum',
      'admin-dashboard',
      'instructor-portal',
    ],
  });
}
