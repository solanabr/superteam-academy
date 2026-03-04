"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Star, Users, Zap, Heart } from "lucide-react";
import { difficultyColors } from "@/lib/utils";
import { useBookmarkStore } from "@/stores/bookmark-store";
import { motion } from "framer-motion";

export interface CourseCardData {
  slug: string;
  title: string;
  description: string;
  thumbnail?: { asset: { url: string } } | null;
  difficulty: 1 | 2 | 3;
  lessonCount: number;
  xpPerLesson: number;
  totalEnrollments: number;
  progress: number | null; // 0-100, null = not enrolled
  tags: string[];
  totalMinutes: number; // sum of estimatedMinutes across all lessons
  averageRating?: number; // optional display-only rating (1-5)
  onChainCourseId?: string; // used to look up live enrollment count
}

/* Difficulty → thumb class, ring colour, icon colour */
const DIFFICULTY_CONFIG = {
  1: {
    thumbClass: "course-thumb-beginner",
    cardClass: "course-card-beginner",
    ringColor: "#14F195",
    iconColor: "#14F195",
    badgeColor: "text-emerald-400",
  },
  2: {
    thumbClass: "course-thumb-intermediate",
    cardClass: "course-card-intermediate",
    ringColor: "#F59E0B",
    iconColor: "#F59E0B",
    badgeColor: "text-amber-400",
  },
  3: {
    thumbClass: "course-thumb-advanced",
    cardClass: "course-card-advanced",
    ringColor: "#EF4444",
    iconColor: "#EF4444",
    badgeColor: "text-red-400",
  },
} as const;

function CourseCardComponent({
  course,
  priority,
  index = 0,
}: {
  course: CourseCardData;
  priority?: boolean;
  /** Card position in the grid (0-based) — drives stagger delay */
  index?: number;
}) {
  const t = useTranslations("courses");
  const tb = useTranslations("bookmarks");
  const { toggleBookmark, isBookmarked } = useBookmarkStore();
  const bookmarked = isBookmarked(course.slug);
  const [heartKey, setHeartKey] = useState(0);

  const difficultyLabel =
    course.difficulty === 1
      ? t("filter.beginner")
      : course.difficulty === 2
        ? t("filter.intermediate")
        : t("filter.advanced");

  const totalXp = course.lessonCount * course.xpPerLesson;
  const durationMinutes =
    course.totalMinutes > 0 ? course.totalMinutes : course.lessonCount * 15;
  const durationLabel =
    durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}${t("card.hours")} ${durationMinutes % 60 > 0 ? `${durationMinutes % 60}${t("card.minutes")}` : ""}`.trim()
      : `${durationMinutes}${t("card.minutes")}`;

  const cfg = DIFFICULTY_CONFIG[course.difficulty];

  /* Clamp stagger to 11 to match CSS classes */
  const staggerIndex = Math.min(index, 11);

  function handleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(course.slug);
    /* re-trigger pulse by bumping key */
    setHeartKey((k) => k + 1);
  }

  return (
    <div
      className="relative course-card-stagger"
      data-index={staggerIndex}
    >
      {/* Bookmark button */}
      <button
        type="button"
        onClick={handleBookmark}
        aria-label={bookmarked ? tb("removeBookmark") : tb("addBookmark")}
        className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-background"
      >
        <Heart
          key={heartKey}
          className={`h-4 w-4 transition-colors ${bookmarked ? "fill-primary text-primary heart-pulse" : "text-muted-foreground"}`}
          aria-hidden="true"
        />
      </button>

      <Link href={`/courses/${course.slug}`} aria-label={course.title}>
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <Card
            className={`group h-full transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(20,241,149,0.12)] ${cfg.cardClass} border-white/10 bg-card/60 backdrop-blur-sm`}
          >
            {/* Thumbnail */}
            {course.thumbnail?.asset?.url ? (
              <div className="relative aspect-video overflow-hidden rounded-t-lg">
                <Image
                  src={course.thumbnail.asset.url}
                  alt={course.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={priority}
                  placeholder="empty"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
            ) : (
              /* ── Decorative pattern thumbnail ── */
              <div className={`aspect-video course-thumb ${cfg.thumbClass}`}>
                {/* Glass difficulty badge — top-left overlay */}
                <span className={`course-thumb-badge ${cfg.badgeColor}`}>
                  {difficultyLabel}
                </span>

                {/* Centred icon with pulsing rings */}
                <div className="course-thumb-inner">
                  {/* Outer ring */}
                  <span
                    className="course-icon-ring"
                    style={{
                      width: 80,
                      height: 80,
                      border: `1px solid ${cfg.ringColor}30`,
                      animationDelay: "0s",
                    }}
                  />
                  {/* Inner ring */}
                  <span
                    className="course-icon-ring"
                    style={{
                      width: 56,
                      height: 56,
                      border: `1.5px solid ${cfg.ringColor}50`,
                      animationDelay: "0.6s",
                    }}
                  />
                  {/* Icon container */}
                  <span
                    className="relative z-10 flex items-center justify-center rounded-full p-3"
                    style={{
                      background: `${cfg.ringColor}15`,
                      border: `1px solid ${cfg.ringColor}35`,
                      boxShadow: `0 0 20px ${cfg.ringColor}20`,
                    }}
                  >
                    <BookOpen
                      className="h-8 w-8"
                      style={{ color: cfg.iconColor, opacity: 0.85 }}
                      aria-hidden="true"
                    />
                  </span>
                </div>

                {/* Bottom glass fade strip */}
                <div className="course-thumb-glass-strip" />
              </div>
            )}

            <CardHeader className="space-y-3 pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Difficulty badge */}
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${difficultyColors[course.difficulty]}`}
                  >
                    {difficultyLabel}
                  </span>
                  {course.averageRating !== undefined && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      {course.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>
                {/* Duration pill */}
                {durationMinutes > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {durationLabel}
                  </span>
                )}
              </div>
              <h3 className="line-clamp-2 text-lg font-semibold group-hover:text-primary transition-colors">
                {course.title}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {course.description}
              </p>

              {/* Visual difficulty bar — 3 segments */}
              <div className="flex items-center gap-1 pt-1" aria-label={`Difficulty: ${difficultyLabel}`}>
                <div className={`h-1 flex-1 rounded-full transition-colors ${course.difficulty >= 1 ? 'bg-green-500' : 'bg-white/10'
                  }`} />
                <div className={`h-1 flex-1 rounded-full transition-colors ${course.difficulty >= 2 ? 'bg-amber-500' : 'bg-white/10'
                  }`} />
                <div className={`h-1 flex-1 rounded-full transition-colors ${course.difficulty >= 3 ? 'bg-red-500' : 'bg-white/10'
                  }`} />
              </div>
            </CardHeader>

            <CardContent className="pt-1">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  {course.lessonCount} {t("card.lessons")}
                </span>

                {/* XP — highlighted chip */}
                <span className="xp-glow-chip">
                  <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                  {totalXp} XP
                </span>

                {course.totalEnrollments > 0 && (
                  <span className="flex items-center gap-1 ml-auto">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {course.totalEnrollments}
                  </span>
                )}
              </div>
            </CardContent>

            {course.progress !== null && (
              <CardFooter>
                <div className="w-full space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{t("card.progress")}</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress
                    value={course.progress}
                    className="h-2"
                    aria-label={t("card.progress")}
                  />
                </div>
              </CardFooter>
            )}
          </Card>
        </motion.div>
      </Link>
    </div>
  );
}

export const CourseCard = memo(CourseCardComponent);
