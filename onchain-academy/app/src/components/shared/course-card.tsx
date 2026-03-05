"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import {
  Clock,
  Zap,
  Layers,
  ArrowUpRight,
  Code2,
  BookOpen,
  ShieldCheck,
  Trophy,
  MonitorPlay,
} from "lucide-react";
import type { CourseSummary, Difficulty } from "@/types/domain";
import { formatMinutes } from "@/lib/utils";

const DIFF: Record<
  Difficulty,
  {
    label: string;
    accent: string;
    dim: string;
    glow: string;
    gradA: string;
    gradB: string;
  }
> = {
  beginner: {
    label: "INIT",
    accent: "#14F195",
    dim: "rgba(20,241,149,0.13)",
    glow: "rgba(20,241,149,0.22)",
    gradA: "#0d3b28",
    gradB: "#041a10",
  },
  intermediate: {
    label: "CORE",
    accent: "#9945FF",
    dim: "rgba(153,69,255,0.13)",
    glow: "rgba(153,69,255,0.22)",
    gradA: "#1e0b40",
    gradB: "#0d0520",
  },
  advanced: {
    label: "DEEP",
    accent: "#FF8C42",
    dim: "rgba(255,140,66,0.13)",
    glow: "rgba(255,140,66,0.22)",
    gradA: "#3b1a08",
    gradB: "#1a0b04",
  },
};

function TrackIcon({
  track,
  className,
  style,
}: {
  track: string;
  className?: string;
  style?: CSSProperties;
}) {
  const t = track.toLowerCase();
  if (t.includes("anchor") || t.includes("program"))
    return <Code2 className={className} style={style} />;
  if (t.includes("defi") || t.includes("token"))
    return <Zap className={className} style={style} />;
  if (t.includes("nft") || t.includes("credential"))
    return <ShieldCheck className={className} style={style} />;
  if (t.includes("leader") || t.includes("game"))
    return <Trophy className={className} style={style} />;
  if (t.includes("frontend") || t.includes("ui"))
    return <MonitorPlay className={className} style={style} />;
  return <BookOpen className={className} style={style} />;
}

export function CourseCard({
  course,
}: {
  course: CourseSummary;
}): React.JSX.Element {
  const d = DIFF[course.difficulty] ?? DIFF.beginner;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
    >
      <Link
        href={`/courses/${course.slug}`}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1017]"
        style={{
          boxShadow:
            "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.5) inset",
          transition: "border-color 300ms ease, box-shadow 300ms ease",
        }}
      >
        {/* Difficulty strip — left border accent, full card height */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] z-30 transition-all duration-300"
          style={{
            background: d.accent,
            boxShadow: `0 0 0 0 ${d.accent}`,
          }}
        />
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            boxShadow: `0 0 14px 2px ${d.accent}80`,
            background: d.accent,
          }}
        />

        {/* Hover glow — top radial */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${d.glow}, transparent 65%)`,
          }}
        />

        {/* Hover border highlight */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          style={{
            boxShadow: `inset 0 0 0 1px ${d.accent}30`,
          }}
        />

        {/* ── Image / Fallback ── */}
        <div className="relative w-full aspect-[16/7] overflow-hidden shrink-0">
          {course.imageUrl ? (
            <>
              <Image
                src={course.imageUrl}
                alt={course.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Gradient fade into card body */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom, transparent 40%, #0c1017 100%)`,
                }}
              />
            </>
          ) : (
            /* Generative fallback: geometric gradient + centered icon */
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${d.gradA} 0%, ${d.gradB} 100%)`,
              }}
            >
              {/* Grid overlay */}
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />
              {/* Radial accent bloom */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${d.accent}30, transparent 70%)`,
                }}
              />
              {/* Icon */}
              <div
                className="relative z-10 h-14 w-14 rounded-2xl flex items-center justify-center border border-white/10"
                style={{ background: d.dim }}
              >
                <TrackIcon
                  track={course.track}
                  className="h-7 w-7"
                  style={{ color: d.accent }}
                />
              </div>
              {/* Bottom fade into card */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1/2"
                style={{
                  background: `linear-gradient(to bottom, transparent, #0c1017)`,
                }}
              />
            </div>
          )}

          {/* Difficulty badge — floats over image */}
          <div className="absolute top-3 left-3 z-20">
            <span
              className="font-mono text-[10px] font-bold tracking-[0.18em] px-2 py-1 rounded-lg border"
              style={{
                color: d.accent,
                background: "rgba(12,16,23,0.75)",
                borderColor: d.accent + "40",
                backdropFilter: "blur(6px)",
              }}
            >
              {d.label}
            </span>
          </div>

          {/* Arrow CTA — top right, appears on hover */}
          <div
            className="absolute top-3 right-3 z-20 h-8 w-8 rounded-lg flex items-center justify-center border opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{
              color: d.accent,
              background: "rgba(12,16,23,0.8)",
              borderColor: d.accent + "40",
              backdropFilter: "blur(6px)",
            }}
          >
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex flex-col flex-1 px-5 pt-4 pb-5 gap-3">
          {/* Track label */}
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/30">
            {course.track}
          </p>

          {/* Title */}
          <h3 className="font-bold text-[16px] leading-snug text-white/90 group-hover:text-white transition-colors line-clamp-2">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm leading-relaxed text-white/38 line-clamp-2 flex-1">
            {course.description}
          </p>

          {/* Divider */}
          <div className="h-px w-full bg-white/[0.06]" />

          {/* Footer: meta stats + XP reward */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 font-mono text-[11px] text-white/30">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {formatMinutes(course.durationMinutes)}
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="h-3 w-3" />
                {course.moduleCount}m · {course.lessonCount}l
              </span>
            </div>

            {/* XP — prominent amber display */}
            <div className="flex items-center gap-1 shrink-0">
              <Zap
                className="h-3.5 w-3.5 fill-current"
                style={{ color: "#f59e0b" }}
              />
              <span
                className="font-mono font-bold text-base leading-none"
                style={{
                  color: "#f59e0b",
                  textShadow: "0 0 14px rgba(245,158,11,0.45)",
                }}
              >
                {course.xpTotal}
              </span>
              <span className="font-mono text-[10px] text-white/25 ml-0.5">
                XP
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
