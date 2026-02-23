// app/src/components/module-list.tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, PlayCircle, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Типы для контента (можно импортировать из course-content)
interface Lesson {
    id: string;
    title: string;
    index: number;
}

interface ModuleListProps {
    courseId: string;
    lessons: any[]; // В реальности список уроков
    isEnrolled: boolean;
    // Прогресс - какие уроки пройдены (индексы)
    completedIndices: number[]; 
}

export function ModuleList({ courseId, lessons, isEnrolled, completedIndices }: ModuleListProps) {
  const router = useRouter();

  // Для хакатона: Все уроки кладем в "Module 1: Fundamentals"
  // В будущем можно расширить структуру COURSE_CONTENT
  
  return (
    <Accordion type="single" collapsible defaultValue="module-1" className="w-full">
      <AccordionItem value="module-1" className="border rounded-lg px-4 mb-4 bg-card">
        <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-lg">Module 1: Fundamentals</span>
                <span className="text-sm text-muted-foreground font-normal">
                    {completedIndices.length}/{lessons.length} Lessons Completed
                </span>
            </div>
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-4 space-y-2">
            {lessons.map((lesson, index) => {
                const isCompleted = completedIndices.includes(index);
                // Заблокирован если не записан
                const isLocked = !isEnrolled;
                
                return (
                    <div 
                        key={index}
                        className={cn(
                            "flex items-center justify-between p-3 rounded-md transition-colors",
                            isCompleted ? "bg-green-500/10 hover:bg-green-500/20" : "hover:bg-muted"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {isCompleted ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className={cn("font-medium", isCompleted && "text-green-600 dark:text-green-400")}>
                                {index + 1}. {lesson.title}
                            </span>
                        </div>

                        {isLocked ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <Button 
                                size="sm" 
                                variant={isCompleted ? "ghost" : "secondary"}
                                onClick={() => router.push(`/courses/${courseId}/lessons/${index}`)}
                            >
                                {isCompleted ? "Review" : "Start"}
                            </Button>
                        )}
                    </div>
                );
            })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}