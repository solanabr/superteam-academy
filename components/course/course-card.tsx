import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Star, Trophy } from 'lucide-react';
import type { Course } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const difficultyColors = {
    beginner: 'text-primary border-primary/20 bg-primary/5',
    intermediate: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    advanced: 'text-rose-500 border-rose-500/20 bg-rose-500/5'
  };

  return (
    <Link href={`/courses/${course.slug}` as any}>
      <Card className="group relative h-full overflow-hidden transition-all duration-300 hover:translate-y-[-2px] bg-white/[0.03] border-white/10 hover:border-primary/50 hover:bg-white/[0.05] rounded-[1.25rem]">
        <CardHeader className="p-0">
          <div className="relative aspect-[16/9] overflow-hidden bg-white/5">
            {course.thumbnail_url ? (
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                <BookOpen className="h-12 w-12 text-primary/40" />
              </div>
            )}
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            
            {/* XP Badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-black tracking-widest text-primary uppercase">
              <Star className="h-3 w-3 fill-primary" />
              <span>500 XP</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center gap-2">
            {course.difficulty && (
              <Badge variant="outline" className={cn("capitalize text-[8px] font-black tracking-widest h-4.5 px-2 rounded-full", difficultyColors[course.difficulty])}>
                {course.difficulty}
              </Badge>
            )}
            <Badge variant="outline" className="text-[8px] font-black tracking-widest h-4.5 px-2 rounded-full bg-white/5 border-white/5 text-muted-foreground uppercase">
              {course.category || 'Development'}
            </Badge>
          </div>
          <h3 className="mb-1.5 font-bold text-lg tracking-tight line-clamp-2 leading-[1.2] group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed font-medium">
            {course.description}
          </p>
        </CardContent>
        <CardFooter className="px-5 pb-5 pt-0 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            {course.duration_minutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{Math.round(course.duration_minutes / 60)}h</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              <span>cNFT</span>
            </div>
          </div>
          
          <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
