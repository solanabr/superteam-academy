"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { getLearningProgressService } from "@/lib/services/learning-progress";
import type { Module } from "@/lib/cms/schemas";

export function CurriculumWithProgress({
  courseId,
  courseSlug,
  modules,
}: {
  courseId: string;
  courseSlug: string;
  modules?: Module[];
}) {
  const { user } = useAuth();
  const [completedBitmap, setCompletedBitmap] = useState<bigint>(0n);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    if (!user) return;
    const service = getLearningProgressService();
    service.getProgress(user.id, courseId).then((progress) => {
      if (progress) {
        setCompletedBitmap(BigInt(progress.lessonProgress));
        setEnrolled(true);
      }
    }).catch(() => {});
  }, [user, courseId]);

  if (!modules || modules.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-5">Curriculum</h2>
        <div className="p-8 rounded-2xl border border-dashed border-neutral-300 text-center">
          <p className="text-neutral-400">
            Curriculum details are being finalized. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  let lessonGlobalIndex = 0;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-5">Curriculum</h2>
      <div className="space-y-4">
        {modules.map((mod, moduleIndex) => {
          const moduleStartIndex = lessonGlobalIndex;
          return (
            <div
              key={mod._id}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden"
            >
              <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="font-semibold text-sm">
                  <span className="text-neutral-400 mr-2">
                    Module {moduleIndex + 1}
                  </span>
                  {mod.title}
                </h3>
              </div>

              {mod.lessons && mod.lessons.length > 0 && (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {mod.lessons.map((lesson, lessonIndex) => {
                    const globalIdx = moduleStartIndex + lessonIndex;
                    const isCompleted = enrolled && (completedBitmap & (1n << BigInt(lesson.order ?? globalIdx))) !== 0n;
                    lessonGlobalIndex = moduleStartIndex + lessonIndex + 1;

                    return (
                      <li key={lesson._id}>
                        <Link
                          href={`/courses/${courseSlug}/lessons/${lesson.slug?.current ?? lesson._id}`}
                          className="flex items-center justify-between px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            {/* Completion indicator */}
                            {isCompleted ? (
                              <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400"><path d="M20 6 9 17l-5-5"/></svg>
                              </span>
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-mono text-neutral-400 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors flex-shrink-0">
                                {lessonIndex + 1}
                              </span>
                            )}
                            <div>
                              <p className={`text-sm font-medium transition-colors ${isCompleted ? "text-emerald-700 dark:text-emerald-400" : "group-hover:text-neutral-700 dark:group-hover:text-neutral-300"}`}>
                                {lesson.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span
                                  className={`text-[10px] font-semibold uppercase ${
                                    lesson.type === "challenge"
                                      ? "text-amber-600"
                                      : "text-neutral-400"
                                  }`}
                                >
                                  {lesson.type}
                                </span>
                                {lesson.estimatedMinutes && (
                                  <span className="text-[10px] text-neutral-400">
                                    {lesson.estimatedMinutes} min
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {lesson.xpReward && (
                              <span className="text-xs font-mono text-neutral-400">
                                +{lesson.xpReward} XP
                              </span>
                            )}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300 group-hover:text-neutral-500 transition-colors"><path d="m9 18 6-6-6-6"/></svg>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
