
"use client";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { CheckCircle, PlayCircle, Code, FileText, HelpCircle, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Lesson {
  id: string;
  title: string;
  type: string;
}

interface Module {
  title: string;
  lessons: Lesson[];
}

interface LessonSidebarProps {
  courseTitle: string;
  slug: string;
  modules: Module[];
  currentLessonId: string;
  completedLessons: string[];
}

const typeIcons: Record<string, any> = {
  video: PlayCircle,
  challenge: Code,
  text: FileText,
  quiz: HelpCircle,
};

export function LessonSidebar({ courseTitle, slug, modules, currentLessonId, completedLessons }: LessonSidebarProps) {
  return (
    <aside className="w-[250px] flex-none border-r border-[#2E2E36] bg-[#0A0A0F] hidden lg:flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-[#2E2E36] bg-[#0A0A0F]">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Course</h3>
        <h2 className="text-sm font-black text-white truncate">{courseTitle}</h2>
      </div>
      
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-6">
          {modules.map((module, i) => (
            <div key={i} className="space-y-2">
              <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-2">
                {module.title}
              </h4>
              <div className="space-y-1">
                {module.lessons.map((lesson) => {
                  const Icon = typeIcons[lesson.type] || FileText;
                  const isActive = lesson.id === currentLessonId;
                  const isCompleted = completedLessons.includes(lesson.id);

                  return (
                    <Link
                      key={lesson.id}
                      href={`/courses/${slug}/lessons/${lesson.id}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 group relative",
                        isActive 
                          ? "bg-[#9945FF]/10 text-[#9945FF] font-bold border border-[#9945FF]/20" 
                          : "text-gray-400 hover:bg-[#1E1E24] hover:text-white"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#9945FF] rounded-r-full" />
                      )}
                      
                      <Icon className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-[#9945FF]" : "text-gray-500 group-hover:text-gray-300"
                      )} />
                      
                      <span className="truncate flex-1">{lesson.title}</span>
                      
                      {isCompleted && (
                        <CheckCircle className="h-3.5 w-3.5 text-[#14F195] shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
