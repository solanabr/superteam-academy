// app/src/components/module-list.tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Lock, Play } from "lucide-react"; // CheckCircle2 красивее
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface ModuleListProps {
    courseId: string;
    lessons: any[];
    isEnrolled: boolean;
    completedIndices: number[]; 
}

export function ModuleList({ courseId, lessons, isEnrolled, completedIndices }: ModuleListProps) {
  const router = useRouter();

  return (
    <Accordion type="single" collapsible defaultValue="module-1" className="w-full">
      <AccordionItem value="module-1" className="border rounded-lg px-4 mb-4 bg-card">
        <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-lg">Module 1: Fundamentals</span>
                <span className="text-sm text-muted-foreground font-normal mt-1">
                    {completedIndices.length}/{lessons.length} Lessons Completed
                </span>
            </div>
        </AccordionTrigger>
        <AccordionContent className="pt-0 pb-4 space-y-2">
            {lessons.map((lesson, index) => {
                const isCompleted = completedIndices.includes(index);
                const isLocked = !isEnrolled;
                
                // Активный урок - это первый непройденный (или последний, если все пройдены)
                const isNextUp = !isCompleted && !isLocked && (index === 0 || completedIndices.includes(index - 1));

                return (
                    <div 
                        key={index}
                        className={cn(
                            "flex items-center justify-between p-3 rounded-md transition-all border",
                            isNextUp ? "bg-accent/50 border-accent" : "border-transparent hover:bg-muted/50"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 fill-green-500/10" />
                            ) : isLocked ? (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", isNextUp ? "border-primary" : "border-muted-foreground")}>
                                    {isNextUp && <div className="h-2.5 w-2.5 bg-primary rounded-full" />}
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className={cn("font-medium text-sm", isCompleted && "text-muted-foreground line-through decoration-transparent")}>
                                    {index + 1}. {lesson.title}
                                </span>
                            </div>
                        </div>

                        {isLocked ? (
                            <Button size="sm" variant="ghost" disabled><Lock className="h-4 w-4" /></Button>
                        ) : (
                            <Button 
                                size="sm" 
                                variant={isCompleted ? "ghost" : (isNextUp ? "default" : "secondary")}
                                onClick={() => router.push(`/courses/${courseId}/lessons/${index}`)}
                                className="h-8 px-3"
                            >
                                {isCompleted ? "Review" : (isNextUp ? "Start" : "Start")}
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