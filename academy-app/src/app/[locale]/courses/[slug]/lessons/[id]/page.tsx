"use client";
import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useCourseData, findLesson } from "~/hooks/queries/useCourseData";
import { useCourseEnrollment } from "~/hooks/queries/useCourseEnrollment";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import LessonHeader from "../_components/LessonHeader";
import LessonSidebar from "../_components/LessonSidebar";
import ChallengeView from "../_components/views/ChallengeView";
import DocumentView from "../_components/views/DocumentView";
import VideoView from "../_components/views/VideoView";
import LoadingSplash from "~/components/LoadingSplash";

export default function LessonPage() {
   const { slug, id } = useParams<{ slug: string; id: string }>();
   const { publicKey } = useWallet();
   const queryClient = useQueryClient();

   const { data: course, isLoading: courseLoading } = useCourseData(slug);

   const lessonResult = course ? findLesson(course, parseInt(id, 10)) : null;
   const lessonIndex = lessonResult?.lessonIndex ?? -1;

   const { data: enrollment, isLoading: enrollLoading } = useCourseEnrollment(
      course?.courseId ?? "",
      course?.lessonCount ?? 0,
   );

   const [sidebarOpen, setSidebarOpen] = useState(false);

   // Whether this lesson is already marked done on-chain
   const alreadyDone = enrollment?.lessonsDone.has(lessonIndex) ?? false;
   const [localDone, setLocalDone] = useState(false);
   const completed = alreadyDone || localDone;

   /** Called by all three views when the learner finishes the lesson content */
   const handleComplete = useCallback(async () => {
      if (completed || !publicKey || !course || lessonIndex < 0) return;
      try {
         const res = await fetch("/api/course/complete-lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               courseId: course.courseId,
               lessonIndex,
               learnerPubkey: publicKey.toBase58(),
            }),
         });
         if (!res.ok) {
            const err = await res.json();
            // 409 = already completed — treat as success
            if (err.error !== "LessonAlreadyCompleted") {
               console.error("[complete-lesson]", err.error);
               return;
            }
         }
         setLocalDone(true);
         // Invalidate enrollment cache so progress bar re-reads bitmap
         queryClient.invalidateQueries({ queryKey: ["enrollment", course.courseId, publicKey.toBase58()] });
      } catch (e) {
         console.error("[complete-lesson]", e);
      }
   }, [completed, publicKey, course, lessonIndex, queryClient]);

   if (courseLoading || enrollLoading) {
      return <LoadingSplash message="Loading lesson…" fullScreen={false} />;
   }

   if (!course || !lessonResult) {
      return (
         <div className="flex items-center justify-center h-full text-sol-muted">
            Lesson not found.
         </div>
      );
   }

   const { lesson, module: lessonModule } = lessonResult;

   // Calculate global start index for the current module to render sidebar correctly
   let currentModuleGlobalStart = 0;
   let globalCount = 0;
   for (const mod of course.modules || []) {
      if (mod.title === lessonModule.title) {
         currentModuleGlobalStart = globalCount;
         break;
      }
      globalCount += mod.lessons?.length || 0;
   }

   const sidebarLessons = (lessonModule.lessons || []).map((l, localIdx) => {
      const gIdx = currentModuleGlobalStart + localIdx;
      // If gIdx is the current lesson, use `completed` state instead of just `enrollment.lessonsDone`
      // so the checkmark appears immediately upon finishing
      const isCurrent = gIdx === lessonIndex;
      return {
         id: gIdx,
         title: l.title,
         active: isCurrent,
         done: isCurrent ? completed : (enrollment?.lessonsDone.has(gIdx) ?? false),
      };
   });

   // Build a Lesson-compatible shape for the existing view components
   const legacyLesson = {
      id: lessonIndex,
      title: lesson.title,
      module: lessonModule.title,
      duration: lesson.duration,
      xp: course.xpPerLesson,
      courseSlug: slug,
      courseTitle: course.title,
      type: lesson.lessonType === 1 ? "video" as const
         : lesson.lessonType === 3 ? "challenge" as const
            : "document" as const,
      content: "",
      body: lesson.body,
      markdownContent: lesson.markdownContent,
      videoUrl: lesson.videoUrl,
      starterCode: lesson.starterCode,
      solutionCode: lesson.solutionCode,
      hints: lesson.hints,
      testCases: lesson.testCases?.map((tc, i) => ({
         id: `tc-${i}`,
         description: tc.expectedOutput,
         validationSnippet: tc.input,
      })),
      language: (lesson.starterCode as any)?.language ?? "rust",
   };

   return (
      <div className="flex flex-col h-full w-full bg-sol-bg font-display overflow-hidden relative">
         <LessonHeader
            lesson={legacyLesson}
            completed={completed}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
         />

         <div className="flex flex-1 overflow-hidden relative">
            <LessonSidebar
               moduleName={lessonModule.title}
               courseSlug={slug}
               sidebarOpen={sidebarOpen}
               setSidebarOpen={setSidebarOpen}
               lessons={sidebarLessons}
            />

            <main className="flex-1 overflow-y-auto">
               {lesson.lessonType === 3 && (
                  <ChallengeView lesson={legacyLesson} completed={completed} setCompleted={handleComplete} />
               )}
               {lesson.lessonType === 2 && (
                  <DocumentView lesson={legacyLesson} completed={completed} setCompleted={handleComplete} />
               )}
               {lesson.lessonType === 1 && (
                  <VideoView lesson={legacyLesson} completed={completed} setCompleted={handleComplete} />
               )}
            </main>
         </div>

         {/* Progress strip */}
         <div className="h-1 bg-sol-border shrink-0 z-30 relative">
            <div
               className="h-full bg-linear-to-r from-sol-green to-sol-forest transition-all duration-700"
               style={{ width: completed ? "100%" : "0%" }}
            />
         </div>
      </div>
   );
}