"use client";

import Link from "next/link";
import { type Lesson } from "@/data/mock";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Code,
  Swords,
  HelpCircle,
  CheckCircle2,
  Lock,
  Zap,
  Clock,
} from "lucide-react";

const LESSON_TYPE_CONFIG = {
  reading: { icon: BookOpen, label: "Reading", color: "text-blue-400" },
  code: { icon: Code, label: "Code Lab", color: "text-solana-green" },
  challenge: { icon: Swords, label: "Challenge", color: "text-orange-400" },
  quiz: { icon: HelpCircle, label: "Quiz", color: "text-purple-400" },
};

interface LessonListProps {
  lessons: Lesson[];
  courseSlug: string;
  completedLessons?: number[];
  currentLesson?: number;
}

export function LessonList({
  lessons,
  courseSlug,
  completedLessons = [],
  currentLesson = 0,
}: LessonListProps) {
  return (
    <div className="space-y-2">
      {lessons.map((lesson, idx) => {
        const config = LESSON_TYPE_CONFIG[lesson.type];
        const Icon = config.icon;
        const isCompleted = completedLessons.includes(lesson.index);
        const isLocked = idx > currentLesson + 1 && !isCompleted;
        const isCurrent = idx === currentLesson;

        return (
          <Link
            key={lesson.index}
            href={isLocked ? "#" : `/course/${courseSlug}/lesson/${lesson.index}`}
            className={cn(
              "flex items-center gap-4 p-4 rounded-lg border transition-all",
              isCompleted && "bg-solana-green/5 border-solana-green/20",
              isCurrent && !isCompleted && "bg-primary/5 border-primary/30 shadow-sm",
              isLocked && "opacity-50 cursor-not-allowed",
              !isCompleted && !isCurrent && !isLocked && "hover:bg-accent hover:border-accent"
            )}
          >
            <div
              className={cn(
                "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                isCompleted
                  ? "bg-solana-green/20"
                  : isCurrent
                  ? "bg-primary/20"
                  : "bg-muted"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-solana-green" />
              ) : isLocked ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Icon className={cn("h-5 w-5", config.color)} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h4 className="font-medium text-sm truncate">{lesson.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {lesson.description}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lesson.estimatedMinutes}m
              </span>
              <span className="flex items-center gap-1 text-solana-green font-medium">
                <Zap className="h-3 w-3" />
                {lesson.xpReward}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-xs",
                  config.color,
                  "bg-current/10"
                )}
                style={{
                  backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)`,
                }}
              >
                {config.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
