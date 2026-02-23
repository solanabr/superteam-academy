import { Link } from 'react-router-dom';
import { Course } from '@/lib/mockData';
import { BookOpen, Clock, Users, Star, Zap } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  progress?: number;
  enrolled?: boolean;
}

const GRADIENT_CLASSES: Record<string, string> = {
  'gradient-purple': 'from-purple-600/30 via-purple-500/10 to-transparent',
  'gradient-green': 'from-emerald-500/30 via-emerald-400/10 to-transparent',
  'gradient-cyan': 'from-cyan-500/30 via-cyan-400/10 to-transparent',
  'gradient-pink': 'from-pink-500/30 via-pink-400/10 to-transparent',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Advanced: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const CATEGORY_ICONS: Record<string, string> = {
  Fundamentals: '⚡',
  'Smart Contracts': '🔧',
  DeFi: '💰',
  NFTs: '🎨',
  Security: '🛡️',
};

export function CourseCard({ course, progress = 0, enrolled = false }: CourseCardProps) {
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const gradientClass = GRADIENT_CLASSES[course.image] || GRADIENT_CLASSES['gradient-purple'];

  return (
    <Link to={`/courses/${course.id}`} className="group block">
      <div className="glass-card-hover rounded-2xl overflow-hidden h-full flex flex-col">
        {/* Card header with gradient */}
        <div className={`relative h-36 bg-gradient-to-br ${gradientClass} bg-card-border/30 p-6 flex flex-col justify-between`}>
          <div className="flex items-start justify-between">
            <span className="text-2xl">{CATEGORY_ICONS[course.category] || '📚'}</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${DIFFICULTY_COLORS[course.difficulty]}`}>
              {course.difficulty}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{course.category}</p>
          </div>

          {/* Progress bar if enrolled */}
          {enrolled && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-card-border">
              <div
                className="h-full bg-gradient-solana transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Card content */}
        <div className="p-5 flex flex-col flex-1 gap-3">
          <div>
            <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {course.title}
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {course.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-card-border">
                {tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-card-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {totalLessons} lessons
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {course.duration}
              </span>
            </div>
            <div className="flex items-center gap-1 xp-badge px-2 py-0.5 rounded-full text-xs font-semibold">
              <Zap className="h-3 w-3" />
              {course.totalXP} XP
            </div>
          </div>

          {/* Students */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{course.students.toLocaleString()} students enrolled</span>
            {enrolled && progress > 0 && (
              <span className="ml-auto text-primary font-medium">{progress}% complete</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
