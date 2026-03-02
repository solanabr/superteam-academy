"use client";

import { Facehash } from "facehash";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/connector/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/connect-wallet";
import {
  Clock,
  Lightning,
  ChartBar,
  Code,
  Users,
  FolderOpen,
  ChatCircle,
  Star,
} from "@phosphor-icons/react";
import { DifficultyBadge } from "./difficulty-badge";
import { mockReviews } from "@/lib/data/reviews-mock";
import { getAvatarColors } from "@/lib/avatar-colors";
import type { Course } from "@/lib/data/types";
import type { EnrollmentStatus } from "@/lib/hooks/use-enrollment-status";

function getContributorNames(course: Course): string[] {
  const fromReviews = mockReviews.slice(0, 2).map((r) => r.author);
  return [course.creator.name, ...fromReviews];
}

type Props = {
  course: Course;
  enrollment: EnrollmentStatus;
};

export function CourseDetailSidebar({ course, enrollment }: Props) {
  const t = useTranslations("courseDetail");
  const { isConnected } = useWallet();

  const completedCount = enrollment.completedLessons.length;
  const progress =
    course.totalLessons > 0
      ? Math.round((completedCount / course.totalLessons) * 100)
      : 0;
  const completionPercent = 48;
  const hours = Math.floor(course.totalDuration / 60);
  const timeLabel =
    hours >= 1
      ? `~${hours} Hour${hours > 1 ? "s" : ""}`
      : `~${course.totalDuration} min`;
  const techLabel = course.tags[0] ?? "Solana";

  return (
    <aside className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("totalYield")}
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-secondary">
              {course.xpReward.toLocaleString()} XP
            </p>
          </div>
          <Facehash
            name={course.creator.name}
            size={40}
            showInitial={false}
            colors={getAvatarColors(course.creator.name)}
            className="ring-2 ring-border dark:ring-white/25 rounded-full overflow-hidden"
          />
        </div>

        <ul className="mt-4 space-y-2.5 text-sm">
          <li className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4 shrink-0" weight="duotone" />
            <span>TIME {timeLabel}</span>
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <ChartBar className="size-4 shrink-0" weight="duotone" />
            <span>
              DIFFICULTY <DifficultyBadge difficulty={course.difficulty} className="ml-0.5" />
            </span>
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <Code className="size-4 shrink-0" weight="duotone" />
            <span>TECH {techLabel}</span>
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4 shrink-0" weight="duotone" />
            <span>
              PEERS {course.enrollmentCount} Active
            </span>
          </li>
        </ul>

        <div className="mt-4">
          {!isConnected ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("connectToEnroll")}
              </p>
              <ConnectButton className="h-11 w-full gap-1.5 px-2.5 text-base font-semibold" />
            </div>
          ) : !enrollment.enrolled ? (
            <Button
              className="h-11 w-full text-base font-semibold"
              size="lg"
            >
              <span className="inline-flex items-center gap-2">
                <FolderOpen className="size-4" weight="duotone" />
                {t("initializeSequence")}
              </span>
            </Button>
          ) : (
            <Button
              asChild
              className="h-11 w-full text-base font-semibold"
              size="lg"
            >
              <Link
                href={`/courses/${course.slug}#curriculum`}
                className="inline-flex items-center gap-2"
              >
                <FolderOpen className="size-4" weight="duotone" />
                {t("continueLearning")}
              </Link>
            </Button>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t("completionRate", { percent: completionPercent })}
        </p>
      </div>

      <div id="contributors" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("contributors")}
          </h3>
          <Link
            href="#contributors"
            className="text-xs font-medium text-primary hover:underline"
          >
            {t("viewAll")}
          </Link>
        </div>
        <div className="flex -space-x-2">
          {getContributorNames(course).map((name) => (
            <Facehash
              key={name}
              name={name}
              size={32}
              showInitial={false}
              colors={getAvatarColors(name)}
              className="rounded-full ring-2 ring-border dark:ring-white/25 overflow-hidden shrink-0"
            />
          ))}
          <span className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
            +2
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <ChatCircle
            className="size-5 shrink-0 text-muted-foreground"
            weight="duotone"
          />
          <div className="min-w-0 space-y-1">
            <h3 className="text-sm font-semibold">{t("stuckOnConcept")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("supportMessage")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("reviews")}
        </h3>
        <ul className="space-y-3">
          {mockReviews.slice(0, 2).map((review) => (
            <li key={review.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < review.rating
                          ? "size-3 fill-secondary text-secondary"
                          : "size-3 text-muted-foreground/40"
                      }
                      weight={i < review.rating ? "fill" : "regular"}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium">{review.author}</span>
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                &ldquo;{review.quote}&rdquo;
              </p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
