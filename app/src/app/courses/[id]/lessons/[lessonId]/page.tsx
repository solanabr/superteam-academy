"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import Link from "next/link"

import type { CourseDefinition } from "@/domain/courses"
import { useLearningProgressService } from "@/services/LearningProgressService"
import { trackEvent } from "@/lib/analytics"
import { LessonLayout } from "@/components/lesson/LessonLayout"
import { LessonContent } from "@/components/lesson/LessonContent"
import { LessonEditor } from "@/components/lesson/LessonEditor"
import { Button } from "@/components/ui/button"

import { useXpAnimation } from "@/context/XpAnimationContext"
import { useLanguage } from "@/context/LanguageContext"


export default function LessonPage() {
  const params = useParams()
  const wallet = useWallet()
  const { t } = useLanguage()

  const courseId = params?.id as string
  const lessonId = Number(params?.lessonId)

  const learningService = useLearningProgressService()

  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [challengePassed, setChallengePassed] = useState(false)
  const { triggerXpAnimation } = useXpAnimation()
  const [course, setCourse] = useState<CourseDefinition | null>(null)

  useEffect(() => {
    const loadCourse = async () => {
      if (!learningService || !courseId) return
      const fetched = await learningService.getCourse(courseId)
      setCourse(fetched)
    }

    loadCourse()
  }, [learningService, courseId])

  const lesson = course?.lessons.find((l) => l.id === lessonId)

  const lessonIndex = useMemo(() => {
    if (!course) return -1
    return course.lessons.findIndex((l) => l.id === lessonId)
  }, [course, lessonId])

  const totalLessons = course?.lessons.length ?? 0

  const previousLesson =
    lessonIndex > 0 ? course?.lessons[lessonIndex - 1] : null

  const nextLesson =
    lessonIndex < totalLessons - 1
      ? course?.lessons[lessonIndex + 1]
      : null

  // Persisted completion read
  useEffect(() => {
    if (!wallet.publicKey || lessonIndex < 0) return

    const key = `superteam:${wallet.publicKey.toBase58()}:lessons:${courseId}`
    const raw = localStorage.getItem(key)

    if (!raw) {
      setCompleted(false)
      return
    }

    const flags: number[] = JSON.parse(raw)

    const wordIndex = Math.floor(lessonIndex / 32)
    const bitIndex = lessonIndex % 32
    const mask = 1 << bitIndex

    const isCompleted = (flags[wordIndex] & mask) !== 0
    setCompleted(isCompleted)
    setChallengePassed(isCompleted)

  }, [wallet.publicKey, lessonIndex, courseId])

  if (!course) {
    return <div className="p-8">{t("lesson.loading")}</div>
  }

  if (!lesson) {
    return <div className="p-8">{t("lesson.notFound")}</div>
  }

  const handleComplete = async () => {
    if (completed) return
    if (!learningService) {
      alert(t("lesson.walletError"))
      return
    }

    if (lesson.type === "challenge" && !challengePassed) {
      alert(t("lesson.passChallenge"))
      return
    }

    try {
      setLoading(true)

      await learningService.completeLesson(courseId, lessonIndex)

      setCompleted(true)

      trackEvent("lesson_completed", {
        course_id: courseId,
        lesson_id: lesson.id,
        lesson_index: lessonIndex,
        xp_reward: lesson.xpReward,
      })

      triggerXpAnimation(lesson.xpReward)

    } catch (err) {
      console.error(err)
      alert(t("lesson.completeError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">

      {/* Main Content Area */}
      <div className="flex-1 pb-28 px-4 md:px-6">

        {lesson.type === "challenge" ? (
          <LessonLayout
            left={
              <LessonContent
                title={t(lesson.title)}
                content={t(lesson.content)}
                xpReward={lesson.xpReward}
                completed={completed}
                loading={loading || !learningService}
                onComplete={handleComplete}
                currentIndex={lessonIndex}
                totalLessons={totalLessons}
              />
            }
            right={
              <LessonEditor
                lessonType={lesson.type}
                starterCode={lesson.starterCode}
                challenge={lesson.challenge}
                onPass={() => setChallengePassed(true)}
              />
            }
          />
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-10 bg-background rounded-xl border shadow-sm">
            <LessonContent
              title={t(lesson.title)}
              content={t(lesson.content)}
              xpReward={lesson.xpReward}
              completed={completed}
              loading={loading || !learningService}
              onComplete={handleComplete}
              currentIndex={lessonIndex}
              totalLessons={totalLessons}
            />
          </div>
        )}

      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t shadow-lg bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

          {/* Previous */}
          {previousLesson ? (
            <Button variant="outline" asChild className="shadow-sm hover:shadow-md transition">
              <Link href={`/courses/${courseId}/lessons/${previousLesson.id}`}>
                ← {t("lesson.previous")}
              </Link>
            </Button>
          ) : (
            <div />
          )}

          {/* Next or Complete */}
          {nextLesson ? (
            <Button asChild className="shadow-sm hover:shadow-md transition">
              <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                {t("lesson.next")} →
              </Link>
            </Button>
          ) : (
            <div className="flex gap-4">

              <Button variant="outline" asChild className="shadow-sm hover:shadow-md transition">
                <Link href={`/courses/${courseId}`}>
                  {t("lesson.backToCourse")}
                </Link>
              </Button>

              <Button asChild className="shadow-sm hover:shadow-md transition">
                <Link href={`/certificates/${courseId}`}>
                  {t("lesson.completeCourse")}
                </Link>
              </Button>

            </div>
          )}

        </div>
      </div>

    </div>
  )
}