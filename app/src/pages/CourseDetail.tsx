import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCourse } from '@/lib/mockData';
import { useCourse } from '@/hooks/useCourse';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, CheckCircle, Lock, ChevronRight, Clock, Zap, Code2, ArrowLeft } from 'lucide-react';

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { enroll, isEnrolled, getCourseProgressPercent, progress } = useCourse(courseId);
  const navigate = useNavigate();

  const course = getCourse(courseId || '');
  if (!course) return <div className="text-center py-20 text-muted-foreground">Course not found.</div>;

  const enrolled = isEnrolled(course.id);
  const progressPct = getCourseProgressPercent(course.id);
  const allLessons = course.modules.flatMap(m => m.lessons);
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter(l => progress.completedLessons.includes(l.id)).length;

  const handleEnroll = () => {
    if (!user) { navigate('/login'); return; }
    enroll(course.id);
  };

  const DIFFICULTY_COLORS: Record<string, string> = {
    Beginner: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    Intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    Advanced: 'text-red-400 bg-red-400/10 border-red-400/30',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-card-border bg-background-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${DIFFICULTY_COLORS[course.difficulty]}`}>{course.difficulty}</span>
                <span className="text-xs px-2.5 py-1 rounded-full border border-card-border text-muted-foreground">{course.category}</span>
              </div>
              <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
              <p className="text-muted-foreground max-w-2xl leading-relaxed">{course.description}</p>
              <div className="flex flex-wrap gap-4 mt-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{totalLessons} lessons</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{course.duration}</span>
                <span className="flex items-center gap-1.5 xp-badge px-2.5 py-1 rounded-full"><Zap className="h-3.5 w-3.5" />{course.totalXP} XP</span>
              </div>
            </div>

            {/* Enroll card */}
            <div className="glass-card rounded-2xl p-5 w-full lg:w-72 flex-shrink-0">
              {enrolled ? (
                <>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold gradient-text">{progressPct}%</span>
                    </div>
                    <div className="progress-bar h-2">
                      <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{completedCount} of {totalLessons} lessons completed</p>
                  </div>
                  <Link
                    to={allLessons.find(l => !progress.completedLessons.includes(l.id))?.type === 'challenge'
                      ? `/challenge/${allLessons.find(l => !progress.completedLessons.includes(l.id))?.id}`
                      : `/learn/${allLessons.find(l => !progress.completedLessons.includes(l.id))?.id || allLessons[0]?.id}`
                    }
                    className="block w-full btn-solana py-2.5 rounded-xl text-sm font-bold text-center"
                  >
                    Continue Learning
                  </Link>
                </>
              ) : (
                <>
                  <p className="font-bold text-lg mb-1">Free Course</p>
                  <p className="text-sm text-muted-foreground mb-4">Earn {course.totalXP} XP on completion</p>
                  <button onClick={handleEnroll} className="w-full btn-solana py-2.5 rounded-xl text-sm font-bold">
                    Enroll Now — It's Free
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-xl font-bold mb-6">Course Curriculum</h2>
        <div className="space-y-4 max-w-3xl">
          {course.modules.map((module, mi) => (
            <div key={module.id} className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-card-border bg-background-secondary">
                <h3 className="font-semibold">Module {mi + 1}: {module.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{module.lessons.length} lessons</p>
              </div>
              <div className="divide-y divide-card-border">
                {module.lessons.map((lesson, li) => {
                  const done = progress.completedLessons.includes(lesson.id);
                  const accessible = enrolled || li === 0;
                  const href = lesson.type === 'challenge' ? `/challenge/${lesson.id}` : `/learn/${lesson.id}`;
                  return (
                    <div key={lesson.id} className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${accessible ? 'hover:bg-muted/20' : 'opacity-50'}`}>
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${done ? 'bg-success/15' : 'bg-muted/30'}`}>
                        {done ? <CheckCircle className="h-4 w-4 text-success" /> : accessible ? <BookOpen className="h-4 w-4 text-muted-foreground" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${done ? 'text-success' : 'text-foreground'}`}>{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${lesson.type === 'challenge' ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                            {lesson.type === 'challenge' ? '⚡ Challenge' : '📖 Lesson'}
                          </span>
                          <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                          <span className="text-xs xp-badge px-1.5 py-0.5 rounded font-medium">+{lesson.xpReward} XP</span>
                        </div>
                      </div>
                      {accessible && (
                        <Link to={href} className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                          {done ? 'Review' : 'Start'} <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
