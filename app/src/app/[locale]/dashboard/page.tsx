'use client';

import { useGamification } from '@/context/GamificationContext';
import { useEffect, useState } from 'react';
import { Course } from '@/lib/content';
import { ProfilePanel } from '@/components/dashboard/ProfilePanel';
import { StreakGrid } from '@/components/dashboard/StreakGrid';
import { CourseProgress } from '@/components/dashboard/CourseProgress';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

export default function DashboardPage() {
  const { streak, refreshUser, completedLessons } = useGamification();
  const [courses, setCourses] = useState<Course[]>([]);
  
  useEffect(() => {
    refreshUser?.();
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => setCourses(data.courses))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-12">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Panel - Profile & Stats (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
             <ProfilePanel />
             <StreakGrid activeDates={[]} /> {/* activeDates prop can be populated from user meta later */}
             
             <div className="hidden lg:block p-6 rounded-3xl bg-gradient-to-br from-[#9945FF]/10 to-[#14F195]/10 border border-[#9945FF]/20 relative overflow-hidden">
                <div className="relative z-10">
                   <h4 className="text-sm font-bold text-white mb-2">Pro Tip</h4>
                   <p className="text-xs text-gray-400 leading-relaxed">
                     Finish "Anchor 101" to unlock the exclusive **Grandmaster** badge and mint your first credential.
                   </p>
                </div>
             </div>
          </div>

          {/* Right Panel - Progress & Feed (8 cols) */}
          <div className="lg:col-span-8 flex flex-col">
             <CourseProgress 
                courses={courses} 
                completedLessons={completedLessons} 
             />
             
             <ActivityFeed />
          </div>

        </div>
      </div>
    </div>
  );
}
