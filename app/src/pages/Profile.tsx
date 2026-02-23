import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCourse } from '@/hooks/useCourse';
import { getLevel } from '@/lib/xp';
import { COURSES } from '@/lib/mockData';
import { useEffect } from 'react';
import { Wallet, Zap, Trophy, BookOpen, CheckCircle, Copy, ExternalLink } from 'lucide-react';

export default function Profile() {
  const { user, logout, connectWallet } = useAuth();
  const { progress, getCourseProgressPercent } = useCourse();
  const navigate = useNavigate();

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  if (!user) return null;

  const levelInfo = getLevel(progress.xp);
  const xpToNextLevel = levelInfo.nextLevelXP - levelInfo.currentLevelXP;
  const xpProgress = progress.xp - levelInfo.currentLevelXP;
  const xpPercent = Math.min(Math.round((xpProgress / xpToNextLevel) * 100), 100);

  const completedCourses = COURSES.filter(c => {
    const allLessons = c.modules.flatMap(m => m.lessons.map(l => l.id));
    return allLessons.every(id => progress.completedLessons.includes(id));
  });
  const enrolledCourses = COURSES.filter(c => progress.enrolledCourses.includes(c.id));

  const copyAddress = () => {
    if (user.walletAddress) navigator.clipboard.writeText(user.walletAddress);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Profile header */}
        <div className="glass-card rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-20 w-20 rounded-2xl border-2 border-primary/40"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`; }}
            />
            <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-gradient-solana flex items-center justify-center text-xs font-bold text-background">
              {levelInfo.level}
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground text-sm">{user.email || 'Wallet user'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="xp-badge text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <Zap className="h-3 w-3" /> {progress.xp.toLocaleString()} XP
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 font-medium">
                {levelInfo.title}
              </span>
              {user.provider && (
                <span className="text-xs px-2.5 py-1 rounded-full border border-card-border text-muted-foreground capitalize">{user.provider}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="text-sm text-destructive hover:underline"
          >
            Sign out
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-6">
          {/* XP / Level */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" /> Level Progress
            </h2>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-bold gradient-text">{levelInfo.level}</span>
              <span className="text-muted-foreground text-sm mb-1">/ 10</span>
            </div>
            <p className="text-sm font-medium text-primary mb-2">{levelInfo.title}</p>
            <div className="progress-bar h-2 mb-1.5">
              <div className="progress-fill" style={{ width: `${xpPercent}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{xpProgress} / {xpToNextLevel} XP to Level {levelInfo.level + 1}</p>
          </div>

          {/* Wallet */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> Wallet
            </h2>
            {user.walletAddress ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-medium">Connected · Devnet</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground break-all bg-muted/30 rounded-lg p-2.5 mt-2">{user.walletAddress}</p>
                <button onClick={copyAddress} className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="h-3.5 w-3.5" /> Copy address
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Connect your Solana wallet to receive on-chain credentials.</p>
                <button onClick={() => connectWallet()} className="btn-solana px-4 py-2 rounded-lg text-sm font-semibold">
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Lessons Done', value: progress.completedLessons.length, icon: BookOpen },
            { label: 'Courses', value: enrolledCourses.length, icon: BookOpen },
            { label: 'Completed', value: completedCourses.length, icon: CheckCircle },
          ].map(stat => (
            <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold gradient-text">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Enrolled Courses */}
        {enrolledCourses.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-semibold mb-4">My Courses</h2>
            <div className="space-y-3">
              {enrolledCourses.map(course => {
                const prog = getCourseProgressPercent(course.id);
                return (
                  <div key={course.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{course.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 progress-bar h-1.5">
                          <div className="progress-fill" style={{ width: `${prog}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{prog}%</span>
                      </div>
                    </div>
                    {prog === 100 && (
                      <div className="flex items-center gap-1 text-xs text-success font-semibold flex-shrink-0">
                        <CheckCircle className="h-4 w-4" /> Complete
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
