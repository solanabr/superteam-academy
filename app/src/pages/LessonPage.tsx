import { useParams, Link, useNavigate } from 'react-router-dom';
import { getLesson } from '@/lib/mockData';
import { useCourse } from '@/hooks/useCourse';
import { useAuth } from '@/hooks/useAuth';
import { LessonViewer } from '@/components/LessonViewer';
import { ArrowLeft, ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { useState } from 'react';

export default function Lesson() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const { completeLesson, isCompleted } = useCourse();
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const data = getLesson(lessonId || '');
  if (!data) return <div className="text-center py-20 text-muted-foreground">Lesson not found.</div>;

  const { lesson, course, module } = data;
  const alreadyDone = isCompleted(lesson.id);
  const allLessons = course.modules.flatMap(m => m.lessons);
  const idx = allLessons.findIndex(l => l.id === lesson.id);
  const nextLesson = allLessons[idx + 1];

  const handleComplete = async () => {
    if (!user) { navigate('/login'); return; }
    setCompleting(true);
    await new Promise(r => setTimeout(r, 600));
    const result = completeLesson(lesson.id, lesson.xpReward);
    setCompleted(true);
    setCompleting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-card-border bg-background-secondary sticky top-16 z-40">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/courses/${course.id}`} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{course.title} · {module.title}</p>
              <p className="font-semibold text-sm truncate">{lesson.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="xp-badge text-xs px-2 py-1 rounded-full font-semibold hidden sm:flex items-center gap-1">
              <Zap className="h-3 w-3" /> +{lesson.xpReward} XP
            </span>
            {(alreadyDone || completed) && (
              <span className="flex items-center gap-1 text-xs text-success font-semibold">
                <CheckCircle className="h-4 w-4" /> Done
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <LessonViewer content={lesson.content} />

        {/* Complete button */}
        <div className="mt-10 pt-8 border-t border-card-border flex items-center justify-between">
          {idx > 0 && (
            <Link
              to={allLessons[idx - 1].type === 'challenge' ? `/challenge/${allLessons[idx - 1].id}` : `/learn/${allLessons[idx - 1].id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-card-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-muted transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </Link>
          )}
          <div className="flex items-center gap-3 ml-auto">
            {!alreadyDone && !completed ? (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="btn-solana px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-60"
              >
                {completing ? (
                  <><div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" /> Completing...</>
                ) : (
                  <><CheckCircle className="h-4 w-4" /> Mark Complete</>
                )}
              </button>
            ) : nextLesson ? (
              <Link
                to={nextLesson.type === 'challenge' ? `/challenge/${nextLesson.id}` : `/learn/${nextLesson.id}`}
                className="btn-solana px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                Next Lesson <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link to={`/courses/${course.id}`} className="btn-solana px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
                Back to Course <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {(completed) && (
          <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20 animate-slide-up">
            <CheckCircle className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-semibold text-success">Lesson completed! +{lesson.xpReward} XP</p>
              {nextLesson && <p className="text-xs text-muted-foreground mt-0.5">Ready for the next lesson?</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
