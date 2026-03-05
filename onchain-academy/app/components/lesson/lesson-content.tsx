import React from "react";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Checkmark } from "@hugeicons/core-free-icons";
import type { Lesson } from "@/lib/services/types";

interface LessonContentProps {
  lesson: Lesson;
  isCompleted: boolean;
  leftPanelWidth: number;
  t: (key: string) => string;
}

export function LessonContent({
  lesson,
  isCompleted,
  leftPanelWidth,
  t,
}: LessonContentProps) {
  return (
    <div className="bg-background overflow-y-auto flex-shrink-0 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.02)] z-0" style={{ width: `${leftPanelWidth}%` }}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary">{lesson.xpReward} XP</Badge>
          <Badge variant="outline">{t("coding")}</Badge>
          {isCompleted && (
            <Badge variant="default" className="bg-green-500">
              <HugeiconsIcon icon={Checkmark} size={12} className="mr-1" />
              {t("completed")}
            </Badge>
          )}
        </div>
        
        <h1 className="text-xl font-bold text-foreground mb-4">{lesson.title}</h1>

        <div className="prose prose-muted max-w-none text-sm">
          <p>{t("completeChallenge")}</p>
          
          {lesson.testCases && lesson.testCases.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-foreground mb-2">{t("testCases")}</h4>
              <ul className="list-disc pl-4 space-y-1">
                {lesson.testCases.map((tc, i) => (
                  <li key={i} className="text-muted-foreground">{tc.description}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
