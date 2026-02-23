// app/src/app/(dashboard)/courses/[courseId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProgram } from "@/hooks/useProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Users, Star, BookOpen } from "lucide-react";
import { ModuleList } from "@/components/module-list";

// Импортируем контент (заголовки уроков)
import { COURSE_CONTENT } from "@/lib/course-content";

// Хелпер для подсчета (можно вынести в utils)
function getCompletedIndices(lessonFlags: any): number[] {
    if (!lessonFlags) return [];
    const indices: number[] = [];
    // Простейшая логика для демо: если флаги есть, парсим.
    // Пока для хакатона можно использовать упрощенную проверку или тот код из sync.ts
    // Для скорости пока вернем пустой массив или реализуем позже.
    return [];
}

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
  // TODO: Реализовать парсинг lessonFlags для получения списка completedIndices
  const completedIndices: number[] = []; 

  

    return (
    <div className="container py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-8">
            <div>
                <Badge variant="outline" className="mb-4 text-purple-400 border-purple-400/30">Official Course</Badge>
                <h1 className="text-4xl font-extrabold mb-4">{courseContent.title}</h1>
                <p className="text-xl text-muted-foreground">
                    Master the basics of Solana development. Build real dApps, earn XP, and get certified.
                </p>
            </div>

            {/* Stats Bar */}
            <div className="flex gap-6 text-sm text-muted-foreground border-y py-4">
                <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> {courseContent.lessons.length} Lessons</div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4" /> 1,204 Students</div>
                <div className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> 4.9/5</div>
            </div>

            {/* Curriculum */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Curriculum</h2>
                <ModuleList 
                    courseId={courseId} 
                    lessons={courseContent.lessons.map((l, i) => ({ ...l, index: i }))}
                    isEnrolled={isEnrolled}
                    completedIndices={completedIndices}
                />
            </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6">
            <Card className="p-6 sticky top-24 border-purple-500/20 bg-purple-500/5">
                <div className="mb-6">
                    <div className="aspect-video bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg flex items-center justify-center mb-4 shadow-inner">
                        <span className="text-4xl font-bold text-white/20">RPC</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Course Progress</span>
                        <span className="text-sm text-muted-foreground">0%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 w-0" />
                    </div>
                </div>

                {!isEnrolled ? (
                    <Button size="lg" className="w-full text-lg" onClick={handleEnroll} disabled={enrolling}>
                        {enrolling ? <Loader2 className="animate-spin mr-2" /> : "Enroll Now - Free"}
                    </Button>
                ) : (
                    <Button size="lg" className="w-full text-lg" onClick={() => router.push(`/courses/${courseId}/lessons/0`)}>
                        Continue Learning
                    </Button>
                )}
                
                <p className="text-xs text-center text-muted-foreground mt-4">
                    Includes 500 XP & Certificate of Completion
                </p>
            </Card>

            {/* Instructor */}
            <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Instructor</h3>
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>ST</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">Superteam Brazil</p>
                        <p className="text-sm text-muted-foreground">Core Contributors</p>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}