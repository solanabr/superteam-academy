"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { MeshGradient } from "@/components/MeshGradient";
import { GridPattern } from "@/components/GridPattern";
import { 
  ArrowLeft, Clock, Trophy, Users, BookOpen, 
  Play, Zap, ChevronDown, Lock
} from "lucide-react";
import { useState, useEffect } from "react";
import { getCourseById } from "@/data/courses";

const DIFFICULTY_COLORS = {
  Beginner: "bg-green-500/20 text-green-400",
  Intermediate: "bg-yellow-500/20 text-yellow-400",
  Advanced: "bg-red-500/20 text-red-400",
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  
  const course = getCourseById(params.slug as string);

  // Check enrollment status on load
  useEffect(() => {
    if (course) {
      const userId = publicKey?.toString() || 'guest';
      const enrolled = localStorage.getItem(`enrolled_${userId}_${course.id}`);
      setIsEnrolled(!!enrolled);
    }
  }, [publicKey, course]);

  if (!course) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Course Not Found</h1>
          <Link href="/courses" className="text-white/60 hover:text-white">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const toggleModule = (index: number) => {
    setExpandedModules((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleEnroll = () => {
    // Save enrollment (with guest ID if no wallet)
    const userId = publicKey?.toString() || 'guest';
    localStorage.setItem(`enrolled_${userId}_${course.id}`, JSON.stringify({
      enrolledAt: new Date().toISOString(),
      progress: 0
    }));
    setIsEnrolled(true);

    // Redirect to first lesson
    const firstLesson = course.modules[0]?.lessons[0];
    if (firstLesson) {
      router.push(`/courses/${course.id}/lessons/${firstLesson.id}`);
    }
  };

  const handleStartLearning = () => {
    const firstLesson = course.modules[0]?.lessons[0];
    if (firstLesson) {
      window.location.href = `/courses/${course.id}/lessons/${firstLesson.id}`;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 z-0">
        <MeshGradient />
        <GridPattern />
      </div>

      <main className="relative z-10 pt-16">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link 
            href="/courses" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to courses
          </Link>

          {/* Course Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[course.difficulty]}`}>
                {course.difficulty}
              </span>
              <span className="text-white/40 text-sm">{course.track}</span>
            </div>
            
            <h1 className="text-4xl font-semibold mb-4">{course.title}</h1>
            <p className="text-white/60 text-lg mb-8">{course.description}</p>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-white/60">
                <Clock className="w-4 h-4" />
                {course.duration}
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <BookOpen className="w-4 h-4" />
                {course.lessons} lessons
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Trophy className="w-4 h-4" />
                {course.xp} XP
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Users className="w-4 h-4" />
                {course.badge}
              </div>
            </div>
          </div>

          {/* Enroll / Start Learning Button */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium mb-1">
                  {isEnrolled ? "Continue Learning" : "Ready to start?"}
                </h3>
                <p className="text-white/40 text-sm">
                  {isEnrolled 
                    ? "Pick up where you left off and earn XP." 
                    : "First 3 lessons are free. Enroll to unlock full course and earn XP."}
                </p>
              </div>
              {isEnrolled ? (
                <button 
                  onClick={handleStartLearning}
                  className="px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Continue
                </button>
              ) : (
                <button 
                  onClick={handleEnroll}
                  className="px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-colors"
                >
                  Enroll Now
                </button>
              )}
            </div>
          </div>

          {/* Course Content */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Course Content</h2>
            
            {course.modules.length > 0 ? (
              <div className="space-y-4">
                {course.modules.map((module, moduleIndex) => (
                  <div key={moduleIndex} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleModule(moduleIndex)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="text-left">
                        <h3 className="font-medium">{module.title}</h3>
                        <p className="text-white/40 text-sm">{module.lessons.length} lessons</p>
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-white/40 transition-transform ${
                          expandedModules.includes(moduleIndex) ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    
                    {expandedModules.includes(moduleIndex) && (
                      <div className="border-t border-white/10">
                        {module.lessons.map((lesson, lessonIndex) => {
                          // First 3 lessons are free preview, rest need enrollment
                          const lessonNumber = moduleIndex * 100 + lessonIndex + 1; // Approximate global lesson number
                          const isPreviewLesson = lessonNumber <= 3;
                          const canAccess = isEnrolled || isPreviewLesson;
                          
                          return (
                            <div
                              key={lesson.id}
                              onClick={() => {
                                if (canAccess) {
                                  router.push(`/courses/${course.id}/lessons/${lesson.id}`);
                                }
                              }}
                              className={`w-full flex items-center justify-between p-4 border-b border-white/5 last:border-0 transition-colors text-left ${
                                canAccess
                                  ? "hover:bg-white/5 cursor-pointer" 
                                  : "opacity-50 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {canAccess ? (
                                  lesson.type === "challenge" ? (
                                    <Trophy className="w-4 h-4 text-yellow-400" />
                                  ) : (
                                    <Play className="w-4 h-4 text-white/40" />
                                  )
                                ) : (
                                  <Lock className="w-4 h-4 text-white/20" />
                                )}
                                <span>
                                  {isPreviewLesson && !isEnrolled && (
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded mr-2">Preview</span>
                                  )}
                                  {lessonIndex + 1}. {lesson.title}
                                </span>
                              </div>
                              <span className="text-white/40 text-sm">{lesson.duration}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/40">
                Course content coming soon...
              </div>
            )}
          </div>

          {/* Rewards */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6">Rewards</h2>
            <div className="flex flex-wrap gap-3">
              {course.rewards.map((reward, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  {reward}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
