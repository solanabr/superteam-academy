'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORY_COLORS: Record<string, string> = {
  solana: 'from-purple-600 to-purple-900',
  rust: 'from-orange-600 to-orange-900',
  nft: 'from-pink-600 to-pink-900',
  defi: 'from-green-600 to-green-900',
};

const CATEGORY_ICONS: Record<string, string> = {
  solana: '◎', rust: '🦀', nft: '🖼️', defi: '💰',
};

export default function CoursesPage() {
  const { user, authenticated } = usePrivy();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const wallet = user?.wallet?.address || '';

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { if (authenticated && wallet) loadEnrollments(); }, [authenticated, wallet]);

  async function loadCourses() {
    setLoading(true);
    const { data } = await supabase.from('courses').select('*').eq('is_published', true).order('order_index');
    setCourses(data || []);
    setLoading(false);
  }

  async function loadEnrollments() {
    const { data } = await supabase.from('enrollments').select('course_id').eq('user_wallet', wallet);
    setEnrollments((data || []).map((e: any) => e.course_id));
  }

  async function enroll(courseId: string) {
    if (!authenticated || !wallet) return;
    setEnrolling(courseId);
    await supabase.from('enrollments').upsert({ user_wallet: wallet, course_id: courseId, enrolled_at: new Date().toISOString() }, { onConflict: 'user_wallet,course_id' });
    setEnrollments(prev => [...prev, courseId]);
    setEnrolling(null);
  }

  const filtered = selectedCategory === 'all' ? courses : courses.filter(c => c.category === selectedCategory);
  const categories = ['all', ...Array.from(new Set(courses.map((c: any) => c.category)))];

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Courses</h1>
          <p className="text-gray-400">Learn Solana development from scratch to advanced</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-8 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${selectedCategory === cat ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600'}`}>
              {cat === 'all' ? 'All Courses' : `${CATEGORY_ICONS[cat] || ''} ${cat}`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(course => {
            const enrolled = enrollments.includes(course.id);
            return (
              <div key={course.id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-600 transition-all">
                <div className={`h-32 bg-gradient-to-br ${CATEGORY_COLORS[course.category] || 'from-gray-700 to-gray-900'} flex items-center justify-center`}>
                  <span className="text-6xl">{CATEGORY_ICONS[course.category] || '📚'}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full border capitalize ${course.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400 border-green-500/30' : course.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                      {course.difficulty}
                    </span>
                    {enrolled && <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Enrolled</span>}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span>📚 {course.lesson_count} lessons</span>
                    <span>⏱ {course.duration_minutes} min</span>
                    <span>⚡ {course.xp_reward} XP</span>
                  </div>
                  <button
                    onClick={() => !enrolled && enroll(course.id)}
                    disabled={enrolled || enrolling === course.id}
                    className={`w-full py-3 rounded-xl font-semibold transition-colors ${enrolled ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 cursor-default' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}>
                    {enrolling === course.id ? 'Enrolling...' : enrolled ? '✓ Enrolled — Continue' : 'Enroll Free'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-600">No courses found</div>
        )}
      </div>
    </div>
  );
}
