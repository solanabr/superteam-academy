"use client";

import { useRouter } from 'next/navigation';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth, xpProgressPercent, xpToNextLevel } from '@/contexts/AuthContext';
import { courses, achievements } from '@/data/courses';
import { Zap, Star, Flame, BookOpen, Award, Calendar, ChevronRight, Shield, ExternalLink, Loader } from 'lucide-react';
import { useNFTs } from '@/hooks/useNFTs';

export default function DashboardPage() {
  const { t } = useLang();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pt-20 flex items-center justify-center transition-colors">
        <div className="text-center">
          <p className="text-slate-500 dark:text-gray-400 mb-4">{t('dash.connectRequired')}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-yellow-400 text-gray-950 font-semibold"
          >
            {t('dash.goHome')}
          </button>
        </div>
      </div>
    );
  }

  const enrolledCourseData = courses.filter(c => user.enrolledCourses.includes(c.id));
  const userAchievements = achievements.filter(a => user.achievements.includes(a.id));

  const calendarDays: { date: string; active: boolean }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    calendarDays.push({ date: dateStr, active: user.streakDates.includes(dateStr) });
  }

  const xpProgress = xpProgressPercent(user.xp);
  const { current: xpInBand, needed: xpBandSize } = xpToNextLevel(user.xp);
  const { certificates: blockchainCerts, isLoading: nftsLoading } = useNFTs(user.walletAddress);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pt-20 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('dash.title')}</h1>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-yellow-400 flex items-center justify-center text-gray-950 font-bold">
              {user.avatar}
            </div>
            <div>
              <p className="text-slate-900 dark:text-white font-semibold">{user.displayName}</p>
              {user.walletAddress && (
                <p className="text-slate-400 dark:text-gray-500 text-xs font-mono">
                  {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 backdrop-blur shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <Zap size={16} className="text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-slate-500 dark:text-gray-500 text-sm">{t('dash.xp')}</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{user.xp.toLocaleString()}</div>
            <div className="w-full h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-slate-400 dark:text-gray-600 text-xs mt-1">{Math.round(xpInBand)}/{xpBandSize} {t('dash.toNextLevel')}</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 backdrop-blur shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                <Star size={16} className="text-green-600 dark:text-green-400" />
              </div>
              <span className="text-slate-500 dark:text-gray-500 text-sm">{t('dash.level')}</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{user.level}</div>
            <p className="text-slate-400 dark:text-gray-600 text-xs mt-1">{t('dash.builderRank')}</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 backdrop-blur shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                <Flame size={16} className="text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-slate-500 dark:text-gray-500 text-sm">{t('dash.streak')}</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{user.streak}</div>
            <p className="text-slate-400 dark:text-gray-600 text-xs mt-1">{t('dash.daysInRow')}</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 backdrop-blur shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                <BookOpen size={16} className="text-green-600 dark:text-green-400" />
              </div>
              <span className="text-slate-500 dark:text-gray-500 text-sm">{t('dash.completed')}</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{user.completedCourses.length}</div>
            <p className="text-slate-400 dark:text-gray-600 text-xs mt-1">{t('dash.ofCourses').replace('{total}', String(courses.length))}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Streak Calendar */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-green-600 dark:text-green-400" />
                <h3 className="text-slate-900 dark:text-white font-semibold">{t('dash.streakCalendar')}</h3>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-slate-400 dark:text-gray-600 text-xs font-medium pb-1">{d}</div>
                ))}
                {calendarDays.map((day, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                      day.active
                        ? 'bg-green-100 dark:bg-green-500/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-500/30'
                        : 'bg-slate-50 dark:bg-gray-800/50 text-slate-400 dark:text-gray-600'
                    }`}
                    title={day.date}
                  >
                    {new Date(day.date).getDate()}
                  </div>
                ))}
              </div>
            </div>

            {/* Enrolled Courses */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 shadow-sm dark:shadow-none">
              <h3 className="text-slate-900 dark:text-white font-semibold mb-4">{t('dash.enrolled')}</h3>
              {enrolledCourseData.length === 0 ? (
                <p className="text-slate-400 dark:text-gray-500 text-sm">{t('dash.noEnroll')}</p>
              ) : (
                <div className="space-y-3">
                  {enrolledCourseData.map(course => {
                    const completedInCourse = course.lessons.filter(l =>
                      user.completedLessons.includes(l.id)
                    ).length;
                    const progress = (completedInCourse / course.lessons.length) * 100;
                    const isComplete = user.completedCourses.includes(course.id);

                    return (
                      <button
                        key={course.id}
                        onClick={() => router.push(`/lesson/${course.id}`)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 hover:border-green-300 dark:hover:border-green-500/30 transition-all group"
                      >
                        <div className="text-3xl">{course.icon}</div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 dark:text-white font-medium text-sm">{course.title}</span>
                            {isComplete && (
                              <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-32">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-yellow-400 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-slate-400 dark:text-gray-500 text-xs">
                              {completedInCourse}/{course.lessons.length}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 dark:text-gray-600 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Achievements */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 mb-4">
                <Award size={18} className="text-amber-600 dark:text-amber-400" />
                <h3 className="text-slate-900 dark:text-white font-semibold">{t('dash.achievements')}</h3>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {achievements.map(a => {
                  const unlocked = userAchievements.some(ua => ua.id === a.id);
                  return (
                    <div
                      key={a.id}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                        unlocked
                          ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30'
                          : 'bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-800 opacity-40'
                      }`}
                      title={`${a.title}: ${a.description}`}
                    >
                      <span className="text-lg">{a.icon}</span>
                      <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5 leading-tight px-1">{a.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NFT Certificates */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} className="text-green-600 dark:text-green-400" />
                <h3 className="text-slate-900 dark:text-white font-semibold">{t('dash.certificates')}</h3>
              </div>

              {/* Blockchain Certificates (Real cNFTs) */}
              {user.walletAddress && (
                <div className="mb-4">
                  {nftsLoading ? (
                    <div className="flex items-center gap-2 py-3 text-slate-400 dark:text-gray-500 text-sm">
                      <Loader size={14} className="animate-spin" />
                      {t('dash.loadingNfts')}
                    </div>
                  ) : blockchainCerts.length > 0 ? (
                    <div className="space-y-3">
                      {blockchainCerts.map((cert) => (
                        <div key={cert.mintAddress} className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-yellow-50 dark:from-green-900/30 dark:to-yellow-900/30 border border-green-200 dark:border-green-500/20">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-yellow-400 flex items-center justify-center text-xl overflow-hidden">
                              {cert.image ? (
                                <img src={cert.image} alt={cert.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>🏅</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-slate-900 dark:text-white font-medium text-sm">{cert.name}</p>
                                <span className="px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-[10px] font-bold">
                                  {t('dash.onChain')}
                                </span>
                              </div>
                              <a
                                href={`https://solscan.io/token/${cert.mintAddress}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 dark:text-gray-500 text-xs font-mono flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              >
                                {cert.mintAddress.slice(0, 8)}...
                                <ExternalLink size={10} />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Course Certificates (Mock / Local) */}
              {user.nftCertificates.length === 0 && blockchainCerts.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🏆</div>
                  <p className="text-slate-400 dark:text-gray-500 text-sm">{t('dash.noCerts')}</p>
                  {!user.walletAddress && (
                    <p className="text-slate-400 dark:text-gray-500 text-xs mt-2">{t('dash.connectWalletForNfts')}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {user.nftCertificates.map((cert, i) => {
                    const course = courses.find(c => c.id === cert.courseId);
                    return (
                      <div key={i} className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-yellow-50 dark:from-green-900/30 dark:to-yellow-900/30 border border-green-200 dark:border-green-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-yellow-400 flex items-center justify-center text-xl">
                            {course?.icon || '🎓'}
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-900 dark:text-white font-medium text-sm">{course?.title}</p>
                            <p className="text-slate-400 dark:text-gray-500 text-xs font-mono flex items-center gap-1">
                              {cert.mintAddress.slice(0, 8)}...
                              <ExternalLink size={10} />
                            </p>
                          </div>
                        </div>
                        <p className="text-slate-400 dark:text-gray-600 text-xs mt-2">
                          {t('dash.minted')} {new Date(cert.mintedAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
