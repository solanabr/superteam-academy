import { useParams, Link, useNavigate } from 'react-router-dom';
import { getLesson } from '@/lib/mockData';
import { useCourse } from '@/hooks/useCourse';
import { useAuth } from '@/hooks/useAuth';
import { CodeEditor } from '@/components/CodeEditor';
import { ArrowLeft, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function Challenge() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const { completeLesson, isCompleted } = useCourse();
  const navigate = useNavigate();
  const [xpAwarded, setXpAwarded] = useState(false);

  const data = getLesson(lessonId || '');
  if (!data) return <div className="text-center py-20 text-muted-foreground">Challenge not found.</div>;

  const { lesson, course, module } = data;
  const alreadyDone = isCompleted(lesson.id);
  const allLessons = course.modules.flatMap(m => m.lessons);
  const idx = allLessons.findIndex(l => l.id === lesson.id);
  const nextLesson = allLessons[idx + 1];

  const handleSuccess = () => {
    if (!user) { navigate('/login'); return; }
    if (!alreadyDone && !xpAwarded) {
      completeLesson(lesson.id, lesson.xpReward);
      setXpAwarded(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-card-border bg-background-secondary sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/courses/${course.id}`} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors">
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
            {(alreadyDone || xpAwarded) && (
              <span className="flex items-center gap-1.5 text-xs text-success font-semibold">
                <CheckCircle className="h-4 w-4" /> Completed
              </span>
            )}
            {nextLesson && (alreadyDone || xpAwarded) && (
              <Link
                to={nextLesson.type === 'challenge' ? `/challenge/${nextLesson.id}` : `/learn/${nextLesson.id}`}
                className="flex items-center gap-1.5 btn-solana px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 grid lg:grid-cols-2 gap-6">
        {/* Instructions panel */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold">⚡ Challenge</span>
              <span className="text-xs text-muted-foreground">{lesson.duration}</span>
            </div>
            <h1 className="text-xl font-bold mb-3">{lesson.title}</h1>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{lesson.content}</div>
          </div>

          {/* Tips */}
          <div className="glass-card rounded-2xl p-5 border border-yellow-500/20 bg-yellow-500/5">
            <p className="text-sm font-semibold text-yellow-400 mb-2">💡 Tips</p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• Read the comments in the starter code carefully</li>
              <li>• Replace all TODO comments with your implementation</li>
              <li>• Make sure your function returns the correct values</li>
              <li>• Click "Run & Submit" to validate your solution</li>
            </ul>
          </div>
        </div>

        {/* Editor panel */}
        <div className="min-h-[500px] lg:min-h-0">
          <CodeEditor
            starterCode={lesson.starterCode || '// Write your solution here\n'}
            solutionCode={lesson.solutionCode}
            language={lesson.starterCode?.includes('pub fn') ? 'rust' : 'typescript'}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}
