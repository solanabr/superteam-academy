import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCourse } from '@/hooks/useCourse';
import { getLevel } from '@/lib/xp';
import { COURSES } from '@/lib/mockData';
import { CourseCard } from '@/components/CourseCard';
import { Zap, Trophy, Flame, BookOpen, ArrowRight, Wallet, TrendingUp, Clock } from 'lucide-react';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, connectWallet } = useAuth();
  const { progress, getCourseProgressPercent, isEnrolled } = useCourse();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const levelInfo = getLevel(progress.xp);
  const xpToNextLevel = levelInfo.nextLevelXP - levelInfo.currentLevelXP;
  const xpProgress = progress.xp - levelInfo.currentLevelXP;
  const xpPercent = Math.min(Math.round((xpProgress / xpToNextLevel) * 100), 100);

  const enrolledCourses = COURSES.filter(c => progress.enrolledCourses.includes(c.id));
  const suggestedCourses = COURSES.filter(c => !progress.enrolledCourses.includes(c.id)).slice(0, 2);

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Welcome back, <span className="gradient-text">{user.name}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1">Continue your Solana journey</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* XP Card */}
          <div className="glass-card rounded-2xl p-5 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg xp-badge flex items-center justify-center">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total XP</span>
            </div>
            <p className="text-3xl font-bold gradient-text">{progress.xp.toLocaleString()}</p>
            <div className="mt-3 progress-bar h-1.5">
              <div className="progress-fill" style={{ width: `${xpPercent}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{xpProgress}/{xpToNextLevel} XP to next level</p>
          </div>

          {/* Level */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-purple-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Level</span>
            </div>
            <p className="text-3xl font-bold">{levelInfo.level}</p>
            <p className="text-xs text-muted-foreground mt-2 truncate">{levelInfo.title}</p>
          </div>

          {/* Streak */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <Flame className="h-4 w-4 text-orange-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Streak</span>
            </div>
            <p className="text-3xl font-bold">{progress.streak}</p>
            <p className="text-xs text-muted-foreground mt-2">days active</p>
          </div>

          {/* Completed */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Lessons Done</span>
            </div>
            <p className="text-3xl font-bold">{progress.completedLessons.length}</p>
            <p className="text-xs text-muted-foreground mt-2">of many</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Courses */}
            {enrolledCourses.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg">My Courses</h2>
                  <Link to="/courses" className="text-sm text-primary hover:underline">Browse more</Link>
                </div>
                <div className="space-y-3">
                  {enrolledCourses.map(course => {
                    const prog = getCourseProgressPercent(course.id);
                    const totalLessons = course.modules.flatMap(m => m.lessons).length;
                    const firstIncomplete = course.modules
                      .flatMap(m => m.lessons)
                      .find(l => !progress.completedLessons.includes(l.id));

                    return (
                      <div key={course.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{course.title}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 progress-bar h-1.5">
                              <div className="progress-fill" style={{ width: `${prog}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{prog}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{totalLessons} lessons · {course.difficulty}</p>
                        </div>
                        <Link
                          to={firstIncomplete
                            ? (firstIncomplete.type === 'challenge' ? `/challenge/${firstIncomplete.id}` : `/learn/${firstIncomplete.id}`)
                            : `/courses/${course.id}`
                          }
                          className="flex-shrink-0 btn-solana px-4 py-2 rounded-lg text-sm font-semibold"
                        >
                          {prog === 0 ? 'Start' : 'Continue'}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Start your first course</h3>
                <p className="text-muted-foreground text-sm mb-5">Enroll in a course to track your progress and earn XP.</p>
                <Link to="/courses" className="btn-solana px-6 py-2.5 rounded-lg font-semibold inline-flex items-center gap-2">
                  Browse Courses <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {/* Suggested courses */}
            {suggestedCourses.length > 0 && (
              <div>
                <h2 className="font-bold text-lg mb-4">Suggested for You</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {suggestedCourses.map(course => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Level progress card */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Level Progress</h3>
                <span className="xp-badge text-xs font-bold px-2 py-1 rounded-full">Lv. {levelInfo.level}</span>
              </div>
              <p className="text-sm font-medium text-primary mb-1">{levelInfo.title}</p>
              <div className="progress-bar h-2 mb-2">
                <div className="progress-fill" style={{ width: `${xpPercent}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{xpProgress} XP</span>
                <span>{xpToNextLevel} XP to Level {levelInfo.level + 1}</span>
              </div>
            </div>

            {/* Wallet card */}
            {!user.walletAddress ? (
              <div className="glass-card rounded-2xl p-5 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Connect Wallet</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Connect your Solana wallet to receive on-chain credentials and track achievements.</p>
                <button
                  onClick={handleConnectWallet}
                  className="w-full btn-solana py-2.5 rounded-lg text-sm font-semibold"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-5 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-semibold">Wallet Connected</h3>
                </div>
                <p className="font-mono text-xs text-muted-foreground mt-1 break-all">{user.walletAddress}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400">Devnet</span>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Courses enrolled</p>
                    <p className="font-semibold text-sm">{progress.enrolledCourses.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Last active</p>
                    <p className="font-semibold text-sm">{progress.lastActiveDate || 'Today'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
