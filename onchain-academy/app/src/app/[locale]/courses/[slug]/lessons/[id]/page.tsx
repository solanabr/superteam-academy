import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { mockCourses } from "@/domain/mock-data";
import { MarkCompleteButton } from "@/components/lesson/mark-complete-button";
import { LessonEnrollmentGate } from "@/components/course/lesson-enrollment-gate";
import { CurriculumList } from "@/components/course/curriculum-list";
import { LessonWorkspace } from "@/components/lesson/lesson-workspace";

type Props = {
  params: Promise<{ slug: string; id: string; locale: string }>;
};

export default async function LessonPage({ params }: Props) {
  const { slug, id } = await params;
  const course = mockCourses.find((c) => c.slug === slug);
  const lesson = course?.lessons.find((l) => l.id === id);

  if (!course || !lesson) {
    notFound();
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] md:h-screen bg-background overflow-hidden text-foreground">
      <LessonEnrollmentGate courseId={course.id} courseSlug={course.slug} />
      
      {/* Left Sidebar: Course Index (Playlist) */}
      <div className="w-[320px] shrink-0 border-r border-white/5 bg-[#050505] flex-col hidden lg:flex">
        <div className="p-6 border-b border-white/5">
          <Link href={`/courses/${course.slug}`} className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/50 hover:text-white mb-3 inline-flex items-center gap-1 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Course
          </Link>
          <h2 className="text-[20px] font-bold tracking-tight text-white leading-tight">{course.title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
           <CurriculumList
            courseId={course.id}
            courseSlug={course.slug}
            courseXpReward={course.xpReward}
            lessons={course.lessons}
            variant="sidebar"
          />
        </div>
      </div>

      {/* Main Content: Video/Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#000000]">
        {/* Top Header */}
        <div className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 bg-background z-10">
          <div className="flex items-center gap-3">
             {/* Mobile back button */}
             <Link href={`/courses/${course.slug}`} className="lg:hidden p-2 -ml-2 text-white/50 hover:text-white">
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
             </Link>
             <h1 className="text-[16px] font-semibold text-white truncate">{lesson.title}</h1>
          </div>
          <MarkCompleteButton
            courseId={course.id}
            lessonId={lesson.id}
            lessonType={lesson.type}
            assessmentRequired={lesson.type === "challenge" || Boolean(lesson.exam)}
          />
        </div>

        {/* Dynamic Canvas */}
        <div className="flex-1 overflow-y-auto">
          <LessonWorkspace
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            lessonType={lesson.type}
            lessonMarkdown={lesson.markdown}
            starterCode={lesson.starterCode}
            testCases={lesson.testCases}
            exam={lesson.exam}
          />
        </div>
      </div>
    </div>
  );
}
