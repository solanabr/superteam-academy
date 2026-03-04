"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useLearningProgressService } from "@/services/LearningProgressService"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import type { CourseDefinition } from "@/domain/courses"
import { useWallet } from "@solana/wallet-adapter-react"
import { useLanguage } from "@/context/LanguageContext"
import { trackEvent } from "@/lib/analytics"

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params?.id as string

  const learningService = useLearningProgressService()
  const wallet = useWallet()
  const { t } = useLanguage()

  const [course, setCourse] = useState<CourseDefinition | null>(null)
  const [enrolled, setEnrolled] = useState(false)
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<number[]>([])

  const getEnrollKey = () =>
    wallet.publicKey
      ? `superteam:${wallet.publicKey.toBase58()}:enrollment:${courseId}`
      : null

  useEffect(() => {
    const loadCourse = async () => {
      if (!learningService || !courseId) return
      const fetched = await learningService.getCourse(courseId)
      setCourse(fetched)
    }

    loadCourse()
  }, [learningService, courseId])

  useEffect(() => {
    if (!wallet.publicKey) return
    const key = getEnrollKey()
    if (!key) return
    const local = localStorage.getItem(key)
    setEnrolled(!!local)
  }, [wallet.publicKey, courseId])

  const handleEnroll = async () => {
    if (!wallet.publicKey || !course) return

    try {
      setEnrollLoading(true)

      const key = getEnrollKey()
      if (key) localStorage.setItem(key, "true")

      setEnrolled(true)

      trackEvent("course_enrolled", {
        course_id: course.id,
        course_title: course.title,
        lesson_count: course.lessonCount,
        total_xp: course.lessonCount * course.xpPerLesson,
      })

    } catch (err) {
      console.error("Enrollment failed:", err)
    } finally {
      setEnrollLoading(false)
    }
  }

  useEffect(() => {
    if (!course || !wallet.publicKey) return

    const key = `superteam:${wallet.publicKey.toBase58()}:lessons:${courseId}`
    const raw = localStorage.getItem(key)

    if (!raw) {
      setCompletedLessons([])
      return
    }

    const flags: number[] = JSON.parse(raw)
    const completedIds: number[] = []

    course.lessons.forEach((lesson, index) => {
      const wordIndex = Math.floor(index / 32)
      const bitIndex = index % 32
      const mask = 1 << bitIndex

      if ((flags[wordIndex] & mask) !== 0) {
        completedIds.push(lesson.id)
      }
    })

    setCompletedLessons(completedIds)
  }, [wallet.publicKey, courseId, course])

  const progressPercentage = useMemo(() => {
    if (!course || course.lessonCount === 0) return 0
    return Math.round(
      (completedLessons.length / course.lessonCount) * 100
    )
  }, [completedLessons, course])

  if (!course) {
    return <div className="p-6">{t("common.loading")}</div>
  }

  const totalXP = course.lessonCount * course.xpPerLesson

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

      {/* HERO */}
      <div className="space-y-4">

        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {t(course.title)}
          </h1>

          <Badge variant="secondary">
            {t(`courses.${course.difficulty.toLowerCase()}`)}
          </Badge>
        </div>

        <p className="text-muted-foreground text-base max-w-2xl leading-relaxed">
          {t(course.description)}
        </p>

        {!enrolled && wallet.connected && (
          <Button
            onClick={handleEnroll}
            disabled={enrollLoading}
            size="sm"
            className="mt-2"
          >
            {enrollLoading ? t("courses.enrolling") : t("courses.enroll")}
          </Button>
        )}

        <div className="flex gap-10 text-sm text-muted-foreground pt-5 border-t">
          <div>
            <p className="font-semibold text-lg text-foreground">
              {course.lessonCount}
            </p>
            <p>{t("courses.lessons")}</p>
          </div>

          <div>
            <p className="font-semibold text-lg text-foreground">
              {totalXP}
            </p>
            <p>{t("courses.totalXP")}</p>
          </div>

          <div>
            <p className="font-semibold text-lg text-foreground">
              {course.trackLevel}
            </p>
            <p>{t("courses.trackLevel")}</p>
          </div>
        </div>

      </div>

      {/* PROGRESS */}
      <div className="rounded-xl border p-5 bg-muted/30 space-y-3 shadow-sm">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{t("courses.progress")}</span>
          <span className="text-muted-foreground">
            {progressPercentage}%
          </span>
        </div>
        <Progress value={progressPercentage} />
      </div>

      {/* LESSONS */}
      {enrolled ? (
        <div className="space-y-6">

          <div className="space-y-4">
            {course.lessons.map((lesson, index) => {
              const isCompleted = completedLessons.includes(lesson.id)

              return (
                <div
                  key={lesson.id}
                  className="flex justify-between items-center border rounded-xl px-5 py-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-background"
                >
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {t("courses.lesson")} {index + 1}
                    </p>

                    <p className="font-semibold">
                      {t(lesson.title)}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {lesson.type === "challenge"
                          ? `🧪 ${t("courses.challenge")}`
                          : `📖 ${t("courses.content")}`}
                      </span>

                      <span>•</span>
                      <span>{lesson.xpReward} {t("common.xp")}</span>

                      {isCompleted && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 font-semibold">
                            {t("courses.completed")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link href={`/courses/${course.id}/lessons/${lesson.id}`}>
                    <Button
                      size="sm"
                      variant={isCompleted ? "outline" : "default"}
                    >
                      {isCompleted
                        ? t("courses.reviewShort")
                        : t("courses.startShort")}
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>

          {progressPercentage === 100 && (
            <div className="pt-4 border-t text-center space-y-3">
              <p className="text-green-600 font-semibold text-sm">
                🎉 {t("courses.completedCourse")}
              </p>

              <div className="flex justify-center gap-3">
                <Link href="/courses">
                  <Button size="sm" variant="outline">
                    {t("courses.backToCourses")}
                  </Button>
                </Link>

                <Link href={`/certificates/${course.id}`}>
                  <Button size="sm" className="shadow-sm">
                    {t("courses.viewCertificate")}
                  </Button>
                </Link>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="border rounded-xl p-5 text-center text-sm text-muted-foreground">
          {t("courses.mustEnroll")}
        </div>
      )}

    </div>
  )
}