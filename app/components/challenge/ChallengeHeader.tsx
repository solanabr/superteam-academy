
import { Link } from '@/i18n/routing';

interface ChallengeHeaderProps {
  moduleTitle: string;
  lessonTitle: string;
  courseSlug: string;
}

export function ChallengeHeader({ moduleTitle, lessonTitle, courseSlug }: ChallengeHeaderProps) {


  return (
    <header className="grid grid-cols-[1fr_auto] items-center px-6 h-12 border-b border-border bg-bg-base z-10 text-[11px] font-mono tracking-widest uppercase">
      {/* Left: System Status */}
      <div className="flex items-center gap-6">
        <div className="font-bold">SUPERTEAM_ACADEMY // V.2.11</div>
        <div className="flex items-center gap-2 text-ink-secondary">
          <span className="w-1.5 h-1.5 bg-ink-primary block" />
          IDE: <span className="text-ink-primary">CONNECTED</span>
        </div>
      </div>

      {/* Right: Module Info & Exit */}
      <div className="flex items-center gap-6">
        <div className="text-ink-secondary">
          MODULE: {moduleTitle.substring(0, 15)}... // LESSON {lessonTitle.substring(0, 15)}...
        </div>
        <Link 
          href={`/courses/${courseSlug}`}
          className="font-bold hover:text-ink-secondary transition-colors"
        >
          [ EXIT ]
        </Link>
      </div>
    </header>
  );
}
