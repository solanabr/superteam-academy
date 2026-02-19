// app/src/app/(dashboard)/courses/[courseId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProgram } from "@/hooks/useProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle, Lock, PlayCircle, Loader2 } from "lucide-react";

// Импортируем контент (заголовки уроков)
import { COURSE_CONTENT } from "@/lib/course-content";

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { publicKey } = useWallet();
  const { getUserEnrollment, enrollInCourse } = useProgram();

  const courseId = params.courseId as string;
  const courseContent = COURSE_CONTENT[courseId];

  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Проверка записи при загрузке
  useEffect(() => {
    if (publicKey && courseId) {
      getUserEnrollment(courseId)
        .then((data) => {
          setEnrollment(data); // Если null, значит не записан
        })
        .finally(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, [publicKey, courseId, getUserEnrollment]);

  const handleEnroll = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    setEnrolling(true);
    try {
      const tx = await enrollInCourse(courseId);
      toast.success("Enrolled successfully!", {
        description: `Tx: ${tx.slice(0, 8)}...`,
      });
      
      // Обновляем состояние (имитируем успешную запись, чтобы не ждать RPC)
      setEnrollment({ lessonFlags: [] }); // Заглушка, чтобы показать интерфейс "записан"
      
      // Через пару секунд подтянем реальные данные
      setTimeout(() => {
        getUserEnrollment(courseId).then(setEnrollment);
      }, 2000);

    } catch (error: any) {
      toast.error("Enrollment failed", {
        description: error.message,
      });
    } finally {
      setEnrolling(false);
    }
  };

  if (!courseContent) {
      return <div className="p-8">Course content not found for ID: {courseId}</div>;
  }

  if (loading) {
      return <div className="p-8"><Skeleton className="h-[200px] w-full" /></div>;
  }

  const isEnrolled = !!enrollment;

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex justify-between items-start mb-8">
        <div>
            <h1 className="text-4xl font-bold mb-2">{courseContent.title}</h1>
            <p className="text-muted-foreground text-lg">Master the basics of Solana development.</p>
        </div>
        
        {/* Кнопка действия (Enroll или Continue) */}
        {!isEnrolled ? (
            <Button size="lg" onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enrolling...</>
                ) : (
                    "Enroll in Course"
                )}
            </Button>
        ) : (
            <Button size="lg" variant="secondary" disabled>
                You are enrolled
            </Button>
        )}
      </div>

      <div className="grid gap-4">
        {courseContent.lessons.map((lesson, index) => {
            // Для хакатона показываем все уроки открытыми, если записан
            const isLocked = !isEnrolled;

            return (
                <Card key={lesson.id} className={isLocked ? "opacity-70" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex flex-col">
                            <CardTitle className="text-lg">
                                {index + 1}. {lesson.title}
                            </CardTitle>
                        </div>
                        
                        {isLocked ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.push(`/courses/${courseId}/lessons/${index}`)}
                            >
                                <PlayCircle className="mr-2 h-4 w-4" /> Start
                            </Button>
                        )}
                    </CardHeader>
                </Card>
            );
        })}
      </div>
    </div>
  );
}