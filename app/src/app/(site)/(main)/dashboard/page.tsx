'use client';

import { useAuth } from '@/contexts/AuthContext';

import { SkillRadar } from '@/components/dashboard/SkillRadar';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {

  const { user, isAuthenticated, isLoading } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Calculate generic skills based on level/xp for now
  // Real implementation would track specific lesson tags
  const skillBase = user?.level ? Math.min(user.level * 10 + 20, 100) : 20;
  const userSkills = [
    { subject: 'Rust', A: user?.completedCourses.includes('rust-basics') ? 80 : skillBase, fullMark: 100 },
    { subject: 'Anchor', A: user?.completedCourses.includes('anchor-intro') ? 75 : skillBase * 0.8, fullMark: 100 },
    { subject: 'DeFi', A: skillBase * 0.6, fullMark: 100 },
    { subject: 'Frontend', A: skillBase * 1.2 > 100 ? 100 : skillBase * 1.2, fullMark: 100 },
    { subject: 'NFTs', A: user?.nftCertificates.length ? 90 : skillBase * 0.7, fullMark: 100 },
    { subject: 'Security', A: skillBase * 0.5, fullMark: 100 },
  ];

  // Transform streak dates to heatmap data
  const heatmapData = user?.streakDates.map(date => ({
    date: date,
    count: 1 + Math.floor(Math.random() * 3) // Random intensity for visual variety on active days
  })) || [];


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6 items-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
          {user?.displayName?.[0] || 'U'}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.displayName || 'Builder'}!
          </h1>
          <p className="text-slate-500 dark:text-gray-400">
            Let&apos;s continue your journey to becoming a Solana expert.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Radar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Current Level</h3>
            <div className="text-4xl font-bold text-green-400 mb-2">Level {user?.level || 0}</div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(((user?.xp || 0) % 100), 100)}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{user?.xp || 0} XP</span>
              <span>Next Lvl</span>
            </div>
          </div>

          <SkillRadar skills={userSkills} />
        </div>

        {/* Middle Column: Activity & Courses */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityHeatmap data={heatmapData} />

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-4">In Progress</h3>
            <div className="space-y-4">
              {[
                { title: 'Solana Fundamentals', progress: 80, module: '3/4 Modules' },
                { title: 'Rust Integration', progress: 45, module: '2/5 Modules' },
                { title: 'Anchor Framework', progress: 10, module: '1/6 Modules' },
              ].map((course, i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-xl">
                    📚
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-green-500 transition-colors">{course.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-gray-400">{course.module}</p>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{course.progress}%</span>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
