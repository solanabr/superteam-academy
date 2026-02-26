"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Clock, BookOpen, Star, Zap, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_COURSES } from "@/lib/mock-data";
import { formatXP } from "@/lib/utils/xp";

const difficultyColors: Record<string, string> = {
  beginner: "#14F195",
  intermediate: "#9945FF",
  advanced: "#FF6B35",
  expert: "#FFD700",
};

export function CoursePreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const featuredCourses = MOCK_COURSES.slice(0, 3);

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="section-divider mb-20" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4"
        >
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">
              Learning Paths
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Start your{" "}
              <span className="gradient-text">Solana journey</span>
            </h2>
          </div>
          <Button asChild variant="glass" size="sm" className="gap-2 group shrink-0">
            <Link href="/courses">
              Browse All Courses
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredCourses.map((course, index) => {
            const diffColor = difficultyColors[course.difficulty] ?? "#9945FF";
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <Link href={`/courses/${course.slug}`} className="block h-full">
                  <div className="gradient-border-card card-shine h-full group overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1">
                    {/* Thumbnail */}
                    <div className="relative h-44 overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url(${course.thumbnail})`, backgroundColor: `${course.track.color}18` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />

                      <div className="absolute top-3 left-3">
                        <span
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider"
                          style={{ color: diffColor, backgroundColor: `${diffColor}18`, borderColor: `${diffColor}35` }}
                        >
                          {course.difficulty}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 xp-pill text-[11px]">
                        <Zap className="h-3 w-3" />
                        {formatXP(course.xpReward)} XP
                      </div>
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: `linear-gradient(to right, ${course.track.color}, transparent)` }}
                      />
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-medium mb-1.5" style={{ color: course.track.color }}>
                        {course.track.icon} {course.track.name}
                      </p>
                      <h3 className="font-semibold text-sm mb-1.5 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                        {course.shortDescription}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {course.lessonCount} lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(course.duration / 60)}h
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {course.rating}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.07]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-[9px] font-bold text-white">
                            {course.instructor.name.charAt(0)}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{course.instructor.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {course.enrolledCount.toLocaleString()}
                          <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Learning Paths */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              emoji: "⚡",
              title: "Solana Developer Path",
              desc: "Fundamentals → Anchor → DeFi → Security. The complete journey from zero to senior Solana developer.",
              courses: 6, hours: 120, xp: "10,500 XP", color: "#9945FF",
            },
            {
              emoji: "🔬",
              title: "Solana Researcher Path",
              desc: "Protocol design, cryptography, tokenomics. For those who want to understand how it all works under the hood.",
              courses: 4, hours: 80, xp: "7,200 XP", color: "#14F195",
            },
          ].map((path, i) => (
            <motion.div
              key={path.title}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bento-card card-shine p-6 group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${path.color}15` }}
                >
                  {path.emoji}
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1.5">{path.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{path.desc}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{path.courses} courses</span>
                    <span className="text-muted-foreground">~{path.hours}h</span>
                    <span className="font-bold" style={{ color: path.color }}>{path.xp}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
