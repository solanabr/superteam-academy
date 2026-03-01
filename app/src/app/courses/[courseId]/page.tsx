"use client";

import { useEffect, useState, use } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { fetchAllCourses, getCourseMetadata } from "@/lib/services/course-service";
import { Course, DIFFICULTY_LABELS, DIFFICULTY_COLORS, TRACK_NAMES } from "@/types/academy";
import Link from "next/link";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default function CourseDetailPage({ params }: PageProps) {
  const { courseId } = use(params);
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  const meta = getCourseMetadata(courseId);

  useEffect(() => {
    fetchAllCourses().then((courses) => {
      const found = courses.find((c) => c.courseId === courseId);
      setCourse(found || null);
      setLoading(false);
    });
  }, [courseId]);

  const handleEnroll = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    setEnrolling(true);
    // In production: build and sign enroll transaction
    // For demo: simulate enrollment
    await new Promise((r) => setTimeout(r, 1500));
    setEnrolled(true);
    setEnrolling(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-white/5 rounded" />
          <div className="h-4 w-96 bg-white/5 rounded" />
          <div className="h-64 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
        <p className="text-white/50 mb-6">The course &quot;{courseId}&quot; doesn&apos;t exist.</p>
        <Link href="/courses" className="text-[#14F195] hover:underline">← Back to courses</Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#9945FF]/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-8">
          <Link href="/courses" className="hover:text-white/60 transition-colors">Courses</Link>
          <span>/</span>
          <span className="text-white/70">{meta.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${DIFFICULTY_COLORS[course.difficulty]}`}>
                  {DIFFICULTY_LABELS[course.difficulty]}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-white/50 border border-white/10">
                  {TRACK_NAMES[course.trackId]}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-white/50 border border-white/10">
                  Level {course.trackLevel}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">{meta.title}</h1>
              <p className="text-lg text-white/50 leading-relaxed">{meta.description}</p>
            </div>

            {/* Lesson List */}
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-semibold">Lessons</h2>
              </div>
              <div className="divide-y divide-white/5">
                {meta.lessons.map((lesson, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-medium text-white/40">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80">{lesson}</p>
                      <p className="text-xs text-white/30 mt-0.5">{course.xpPerLesson} XP</p>
                    </div>
                    {enrolled && (
                      <div className="flex-shrink-0">
                        <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded">
                          {index === 0 ? "▶ Start" : "🔒 Locked"}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Code Editor Preview */}
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Interactive Editor</h2>
                <span className="text-xs text-white/30 bg-white/5 px-2.5 py-1 rounded-full">Preview</span>
              </div>
              <div className="p-6">
                <div className="bg-[#1e1e2e] rounded-lg p-4 font-mono text-sm">
                  <div className="text-white/30 mb-2">// Try it out — write your first Solana instruction</div>
                  <div>
                    <span className="text-[#c678dd]">use</span>{" "}
                    <span className="text-[#e5c07b]">anchor_lang</span>::<span className="text-[#e5c07b]">prelude</span>::*;
                  </div>
                  <div className="mt-2">
                    <span className="text-white/30">#[</span><span className="text-[#e5c07b]">program</span><span className="text-white/30">]</span>
                  </div>
                  <div>
                    <span className="text-[#c678dd]">pub mod</span>{" "}
                    <span className="text-[#61afef]">hello_world</span> {"{"}
                  </div>
                  <div className="pl-4">
                    <span className="text-[#c678dd]">pub fn</span>{" "}
                    <span className="text-[#61afef]">initialize</span>
                    (<span className="text-[#e06c75]">ctx</span>: <span className="text-[#e5c07b]">Context</span>&lt;<span className="text-[#e5c07b]">Initialize</span>&gt;) -&gt; <span className="text-[#e5c07b]">Result</span>&lt;()&gt; {"{"}
                  </div>
                  <div className="pl-8">
                    <span className="text-[#61afef]">msg!</span>(<span className="text-[#98c379]">&quot;Hello, Solana!&quot;</span>);
                  </div>
                  <div className="pl-8">
                    <span className="text-[#e5c07b]">Ok</span>(())
                  </div>
                  <div className="pl-4">{"}"}</div>
                  <div>{"}"}</div>
                </div>
                <p className="text-xs text-white/30 mt-3">
                  Full Monaco editor available in lesson view. Supports Rust, TypeScript, and Solana Playground integration.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <div className="glass-card p-6 sticky top-20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Total XP</span>
                  <span className="text-xl font-bold text-[#14F195]">{course.totalXp.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Lessons</span>
                  <span className="text-sm font-medium">{course.lessonCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Completions</span>
                  <span className="text-sm font-medium">{course.totalCompletions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Credential</span>
                  <span className="text-sm font-medium">🏅 Soulbound NFT</span>
                </div>

                {course.prerequisite && (
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <p className="text-xs text-amber-400">
                      ⚠️ Prerequisite: Complete &quot;{course.prerequisite}&quot; first
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  {enrolled ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-[#14F195]/5 border border-[#14F195]/20 text-center">
                        <p className="text-sm text-[#14F195] font-medium">✅ Enrolled!</p>
                        <p className="text-xs text-white/40 mt-1">
                          Complete lessons to earn XP. Backend signer required for lesson verification.
                        </p>
                      </div>
                      <button
                        disabled
                        className="w-full px-4 py-3 rounded-xl font-semibold text-sm
                          bg-white/5 text-white/30 cursor-not-allowed"
                      >
                        Start Lesson 1 (Demo)
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full px-4 py-3 rounded-xl font-semibold text-sm
                        bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white
                        hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200
                        active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                    >
                      {enrolling ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Enrolling...
                        </span>
                      ) : connected ? (
                        "Enroll Now"
                      ) : (
                        "Connect Wallet to Enroll"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* XP Breakdown */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-white/70 mb-4">XP Breakdown</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Per lesson</span>
                  <span className="text-white/70">{course.xpPerLesson} XP × {course.lessonCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Lesson total</span>
                  <span className="text-white/70">{(course.xpPerLesson * course.lessonCount).toLocaleString()} XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Completion bonus</span>
                  <span className="text-[#14F195]">+{Math.floor(course.xpPerLesson * course.lessonCount / 2).toLocaleString()} XP</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between font-semibold">
                  <span className="text-white/60">Total</span>
                  <span className="text-[#14F195]">{course.totalXp.toLocaleString()} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
