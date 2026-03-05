import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ArrowLeft02Icon, 
  BookOpen01Icon,
  CodeIcon,
  CheckmarkSquare01Icon,
  ChevronLeft,
  ChevronRight,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon
} from "@hugeicons/core-free-icons";
import type { Lesson } from "@/lib/services/types";

interface LessonSidebarProps {
  courseSlug: string;
  currentLocale: string;
  allLessons: Lesson[];
  lesson: Lesson;
  currentIndex: number;
  progress: number;
  prevLesson?: { id: string; title: string };
  nextLesson?: { id: string; title: string };
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

const getLessonIcon = (type: string) => {
  switch (type) {
    case "coding": return <HugeiconsIcon icon={CodeIcon} size={14} />;
    case "quiz": return <HugeiconsIcon icon={CheckmarkSquare01Icon} size={14} />;
    default: return <HugeiconsIcon icon={BookOpen01Icon} size={14} />;
  }
};

export function LessonSidebar({
  courseSlug,
  currentLocale,
  allLessons,
  lesson,
  currentIndex,
  progress,
  prevLesson,
  nextLesson,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  t,
}: LessonSidebarProps) {
  return (
    <div className={`border-r border-border bg-card flex-shrink-0 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-64"}`}>
      <div className={`p-4 border-b border-border flex items-center ${isSidebarCollapsed ? "justify-center" : ""}`}>
        <Link 
          href={`/${currentLocale}/courses/${courseSlug}`}
          className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground ${isSidebarCollapsed ? "justify-center w-full" : ""}`}
          title={isSidebarCollapsed ? t("backToCourse") : undefined}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
          {!isSidebarCollapsed && <span>{t("backToCourse")}</span>}
        </Link>
      </div>
      
      {!isSidebarCollapsed ? (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{t("lessonOf", { current: currentIndex + 1, total: allLessons.length })}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <div className="py-3 border-b border-border flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center relative overflow-hidden" title={`${Math.round(progress)}% Complete`}>
            <div className="absolute bottom-0 left-0 right-0 bg-primary/20" style={{ height: `${progress}%` }} />
            <span className="text-[10px] font-medium z-10">{currentIndex + 1}</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {allLessons.map((l, idx) => (
          <Link
            key={l.id}
            href={`/${currentLocale}/courses/${courseSlug}/lessons/${l.id}`}
            className={`flex items-center rounded-lg transition-colors ${
              isSidebarCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
            } ${
              l.id === lesson.id 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title={isSidebarCollapsed ? `${idx + 1}. ${l.title}` : undefined}
          >
            <div className="flex items-center justify-center shrink-0">
              {getLessonIcon(l.type)}
            </div>
            {!isSidebarCollapsed && (
              <span className="truncate text-sm flex-1">{idx + 1}. {l.title}</span>
            )}
          </Link>
        ))}
      </div>

      <div className="p-2 border-t border-border flex flex-col gap-2">
        {prevLesson && (
          <Link 
            href={`/${currentLocale}/courses/${courseSlug}/lessons/${prevLesson.id}`} 
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center justify-center"
            title={`Previous: ${prevLesson.title}`}
          >
            <HugeiconsIcon icon={ChevronLeft} size={18} />
          </Link>
        )}
        {nextLesson && (
          <Link 
            href={`/${currentLocale}/courses/${courseSlug}/lessons/${nextLesson.id}`} 
            className="p-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center"
            title={`Next: ${nextLesson.title}`}
          >
            <HugeiconsIcon icon={ChevronRight} size={18} />
          </Link>
        )}
        
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center justify-center"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <HugeiconsIcon icon={isSidebarCollapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon} size={18} />
        </button>
      </div>
    </div>
  );
}
