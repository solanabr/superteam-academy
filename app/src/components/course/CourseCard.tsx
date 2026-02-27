import { Course } from '@/lib/content';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BarChart } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface CourseCardProps {
  course: Course;
  priority?: boolean;
}

export function CourseCard({ course, priority = false }: CourseCardProps) {
  return (
    <Card className="group flex flex-col h-full hover:border-[#9945FF]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(153,69,255,0.15)] bg-[#0A0A0F] border-[#2E2E36] overflow-hidden">
      <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-900 relative">
        {course.image ? (
            <Image 
                src={course.image} 
                alt={course.title} 
                fill
                priority={priority}
                className="object-cover transition-transform hover:scale-105 duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent opacity-60" />
        )}
        <div className="absolute top-4 left-4 flex gap-2">
             {course.tags?.map(tag => (
                 <Badge key={tag} variant="secondary" className="text-xs backdrop-blur-md bg-black/40 border border-white/10">{tag}</Badge>
             ))}
        </div>
      </div>
      <CardContent className="flex-grow pt-4">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-[#14F195] transition-colors">{course.title}</h3>
        <p className="text-gray-400 text-sm line-clamp-2 mb-4">{course.description}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                    <BarChart className="h-3 w-3 text-[#9945FF]" />
                    <span>{course.difficulty}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#14F195]" />
                    <span>{course.duration}</span>
                </div>
            </div>
            <div className="font-bold text-[#14F195] bg-[#14F195]/10 px-2 py-0.5 rounded border border-[#14F195]/20">
                {course.xp} XP
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="default">
          <Link href={`/courses/${course.slug}`}>
            Start Learning
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
