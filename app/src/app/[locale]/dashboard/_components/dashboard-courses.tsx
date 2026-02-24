"use client";

import React, { useState, useEffect } from "react";
import type { Course } from "@/lib/services/types";
import { TRACK_LABELS, type TrackType } from "@/lib/constants";
import { Reveal, TiltCard, Ring } from "./dashboard-primitives";
import { G, C, D, M, BORDER, SPRING } from "./dashboard-primitives";

const CredBadge: React.FC<{
  name: string;
  xp: number;
  delay?: number;
}> = ({ name, xp, delay = 0 }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <TiltCard
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "10px 14px",
        background: "rgba(0,210,130,0.03)",
        border: "1px solid rgba(0,210,130,0.08)",
        opacity: show ? 1 : 0,
        transform: show ? "none" : "translateY(12px)",
        transition: `all 0.6s ${SPRING}`,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          background: "rgba(0,210,130,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: G,
        }}
      >
        ✦
      </div>
      <div>
        <div
          style={{
            fontFamily: "'Space Grotesk'",
            fontSize: 11,
            fontWeight: 700,
            color: C,
          }}
        >
          {name}
        </div>
        <div style={{ fontFamily: "'Space Grotesk'", fontSize: 10, color: M }}>
          +{xp} XP
        </div>
      </div>
    </TiltCard>
  );
};

interface CourseProgress {
  enrolled: boolean;
  isComplete: boolean;
  completed: number;
  total: number;
  percent: number;
}

export const DashboardCourses: React.FC<{
  currentCourse: Course | null;
  currentProgress: CourseProgress | null;
  completedCourses: Course[];
  unenrolledCourses: Course[];
  allCourses: Course[];
  credentials: { id: string; track: string; xpEarned: number }[];
  resumeTarget: { slug: string; lessonId: string } | null;
  locale: string;
  onResume: () => void;
  onNavigate: (path: string) => void;
}> = ({
  currentCourse,
  currentProgress,
  completedCourses,
  unenrolledCourses,
  allCourses,
  credentials,
  resumeTarget,
  locale,
  onResume,
  onNavigate,
}) => (
  <>
    {/* Current course card */}
    <Reveal delay={200}>
      {currentCourse && currentProgress ? (
        <TiltCard
          style={{
            background: "linear-gradient(135deg, #1a1040, #0d0a25)",
            padding: 28,
            marginBottom: 28,
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
          }}
          onClick={onResume}
        >
          <span
            style={{
              position: "absolute",
              right: -10,
              top: -30,
              fontFamily: "'Instrument Serif', serif",
              fontSize: 180,
              color: "var(--c-text-faint)",
            }}
          >
            {String(allCourses.indexOf(currentCourse) + 1).padStart(2, "0")}
          </span>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {[
                  TRACK_LABELS[currentCourse.track].toUpperCase(),
                  currentCourse.difficulty.toUpperCase(),
                ].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 9,
                      letterSpacing: 1.5,
                      padding: "3px 8px",
                      border: "1px solid var(--overlay-border)",
                      color: "var(--c-text-dim)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h3
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 26,
                  fontWeight: 400,
                  color: C,
                  margin: "0 0 4px",
                }}
              >
                {currentCourse.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12,
                  color: "var(--c-text-dim)",
                  margin: 0,
                }}
              >
                {currentCourse.description.slice(0, 80)}...
              </p>
            </div>
            <Ring
              pct={currentProgress.percent}
              label={`${currentProgress.percent}%`}
            />
          </div>
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                width: "100%",
                height: 2,
                background: "var(--overlay-divider)",
              }}
            >
              <div
                style={{
                  width: `${currentProgress.percent}%`,
                  height: "100%",
                  background: G,
                  transition: `width 2s ${SPRING}`,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 10,
                letterSpacing: 1,
                color: "var(--c-text-faint)",
              }}
            >
              <span>
                LESSON {currentProgress.completed} OF {currentProgress.total}
              </span>
              <span
                onClick={onResume}
                style={{ cursor: "pointer", color: G }}
              >
                CONTINUE →
              </span>
            </div>
          </div>
        </TiltCard>
      ) : completedCourses.length > 0 ? (
        <div
          style={{
            padding: 28,
            marginBottom: 28,
            border: `1px solid ${BORDER}`,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              color: M,
            }}
          >
            All enrolled courses completed! Browse more courses to continue
            learning.
          </p>
        </div>
      ) : (
        <div
          style={{
            padding: 28,
            marginBottom: 28,
            border: `1px solid ${BORDER}`,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              color: M,
            }}
          >
            No courses in progress. Enroll in a course to get started!
          </p>
          <span
            onClick={() => onNavigate(`/${locale}/courses`)}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 10,
              letterSpacing: 2,
              color: G,
              cursor: "pointer",
              marginTop: 8,
              display: "inline-block",
            }}
          >
            BROWSE COURSES →
          </span>
        </div>
      )}
    </Reveal>

    {/* Earned credentials */}
    <Reveal delay={300}>
      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 10,
          letterSpacing: 2,
          color: M,
          margin: "0 0 14px",
        }}
      >
        EARNED CREDENTIALS
      </p>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 32,
        }}
      >
        {credentials.length > 0 ? (
          credentials.map((cred, i) => (
            <CredBadge
              key={cred.id}
              name={`${TRACK_LABELS[cred.track as TrackType]} Credential`}
              xp={cred.xpEarned}
              delay={600 + i * 200}
            />
          ))
        ) : (
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              color: M,
            }}
          >
            Complete courses to earn credentials.
          </p>
        )}
      </div>
    </Reveal>

    {/* Up Next */}
    <Reveal delay={400}>
      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 10,
          letterSpacing: 2,
          color: M,
          margin: "0 0 12px",
        }}
      >
        UP NEXT
      </p>
      {unenrolledCourses.length > 0 ? (
        unenrolledCourses.slice(0, 3).map((c, i) => (
          <div
            key={c.id}
            data-magnetic
            onClick={() => onNavigate(`/${locale}/courses/${c.slug}`)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 0",
              borderBottom: `1px solid ${BORDER}`,
              cursor: "pointer",
              transition: "padding-left 0.3s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.paddingLeft = "12px";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.paddingLeft = "0px";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 22,
                  color: "var(--overlay-border)",
                  fontStyle: "italic",
                  width: 24,
                }}
              >
                {i + 1}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    color: C,
                  }}
                >
                  {c.title}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 10,
                    color: M,
                    letterSpacing: 1,
                  }}
                >
                  {c.lessonCount} LESSONS · {c.xpReward} XP
                </div>
              </div>
            </div>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 9,
                letterSpacing: 1.5,
                padding: "4px 10px",
                border: `1px solid ${BORDER}`,
                color: M,
              }}
            >
              {TRACK_LABELS[c.track].toUpperCase()}
            </span>
          </div>
        ))
      ) : (
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 12,
            color: M,
            padding: "14px 0",
          }}
        >
          You&apos;ve enrolled in all available courses!
        </p>
      )}
    </Reveal>
  </>
);
