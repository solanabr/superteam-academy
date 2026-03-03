// app/src/app/(dashboard)/courses/[courseId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useProgram } from "@/hooks/useProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Users, Star, BookOpen, Share2, Play } from "lucide-react";
import { COURSE_CONTENT } from "@/lib/course-content";
import { ModuleList } from "@/components/module-list";
import Link from "next/link"

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { publicKey } = useWallet();
  const { getUserEnrollment, enrollInCourse } = useProgram();

  const courseId = params.courseId as string;
  const [courseContent, setCourseContent] = useState<any>(null); // Новое состояние

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const loadCourse = async () => {
        setLoading(true);
        try {
            // Загружаем данные из нашей новой CMS
            const res = await fetch(`/api/courses/${courseId}`);
            if (!res.ok) throw new Error("Course not found");
            const data = await res.json();
            setCourseContent(data);

            // Проверяем запись (как было)
            if (publicKey) {
                const enrollment = await getUserEnrollment(courseId);
                setIsEnrolled(!!enrollment);
                const progRes = await fetch(`/api/course/progress?wallet=${publicKey.toString()}&courseId=${courseId}`);
                const indices = await progRes.json();
                setCompletedIndices(indices);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    loadCourse();
  }, [publicKey, courseId, getUserEnrollment]);

  const handleEnroll = async () => {
      if (!publicKey) { toast.error("Connect wallet first"); return; }
      setEnrolling(true);
      try {
          await enrollInCourse(courseId);
          toast.success("Enrolled successfully!");
          setIsEnrolled(true);
      } catch(e: any) { 
          toast.error("Enrollment failed", { description: e.message }); 
      } finally { 
          setEnrolling(false); 
      }
  };

  if (!courseContent) return <div className="p-8 text-center">Course not found</div>;
  if (loading) return <div className="container py-8 max-w-6xl"><Skeleton className="h-[400px] w-full rounded-xl" /></div>;

  // Расчет прогресса
  const totalLessons = courseContent.lessons.length;
  const completedCount = completedIndices.length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  // Находим первый непройденный урок для кнопки "Continue"
  const nextLessonIndex = courseContent.lessons.findIndex((lesson: any, i: number) => !completedIndices.includes(i));
  const continueIndex = nextLessonIndex === -1 ? 0 : nextLessonIndex; // Если все пройдены, ведем на 0

  return (
    <div className="container py-10 max-w-7xl">
      {/* Grid Layout: На десктопах 3 колонки (2 контент, 1 сайдбар) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Main Content (Left - 8 cols) */}
        <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
                <div className="flex gap-2">
                    {/* Пока все курсы считаем официальными. В Этапе 38 добавим логику UGC */}
                    <Badge variant="outline" className="text-purple-400 border-purple-400/30">Official Course</Badge>
                    {/* Динамическая сложность из БД */}
                    <Badge variant="secondary">{courseContent.difficulty || "Beginner"}</Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{courseContent.title}</h1>
                
                {/* Динамическое описание из БД */}
                <p className="text-xl text-muted-foreground leading-relaxed">
                    {courseContent.description || "Master the basics of Solana development. Build real dApps, earn XP, and get certified on-chain."}
                </p>
                
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-2">
                    <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> {totalLessons} Lessons</div>
                    <div className="flex items-center gap-2"><Users className="h-4 w-4" /> 1,200+ Students</div>
                    <div className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 4.9 (120 reviews)</div>
                </div>
            </div>

            {/* Curriculum */}
            <div className="pt-4">
                <h2 className="text-2xl font-bold mb-6">Curriculum</h2>
                <ModuleList 
                    courseId={courseId} 
                    lessons={courseContent.lessons}
                    isEnrolled={isEnrolled}
                    completedIndices={completedIndices}
                />
            </div>
        </div>

        {/* Sidebar (Right - 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
            {/* Карточка прогресса / записи - Sticky */}
            <Card className="p-6 sticky top-24 border-purple-500/20 bg-card/50 backdrop-blur-sm shadow-xl">
                <div className="mb-6 rounded-lg overflow-hidden border border-white/5">
                    {/* Placeholder видео/картинки */}
                    <div className="aspect-video bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center relative">
                        <Play className="h-12 w-12 text-white/80 opacity-50" />
                        <div className="absolute inset-0 bg-black/20" />
                    </div>
                </div>

                {isEnrolled ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Course Progress</span>
                                <span>{progressPercent}%</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-green-500 transition-all duration-500" 
                                    style={{ width: `${progressPercent}%` }} 
                                />
                            </div>
                        </div>
                        <Button size="lg" className="w-full font-bold text-md" onClick={() => router.push(`/courses/${courseId}/lessons/${continueIndex}`)}>
                            {progressPercent === 100 ? "Review Course" : "Continue Learning"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Button size="lg" className="w-full font-bold text-md bg-white text-black hover:bg-gray-200" onClick={handleEnroll} disabled={enrolling}>
                            {enrolling ? <Loader2 className="animate-spin mr-2" /> : "Enroll Now • Free"}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            Includes 500 XP & Certificate of Completion
                        </p>
                    </div>
                )}
            </Card>

            {/* Instructor Card */}
            <div className="border rounded-lg p-6 bg-card/30">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Instructor</h3>
                {courseContent.author ? (
                    // РЕАЛЬНЫЙ АВТОР (ЮЗЕР)
                    <>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-background">
                                <AvatarImage src={courseContent.author.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${courseContent.author.walletAddress}`} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-base">{courseContent.author.username || courseContent.author.name}</p>
                                <p className="text-xs text-muted-foreground">Community Creator</p>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Link href={`/profile/${courseContent.author.username || courseContent.author.walletAddress}`} className="w-full">
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs">View Profile</Button>
                            </Link>
                        </div>
                    </>
                ) : (
                    // ДЕФОЛТНЫЙ АВТОР (Superteam) - Для официальных курсов без привязки к id
                    <>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-background">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>ST</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-base">Superteam Brazil</p>
                                <p className="text-xs text-muted-foreground">Core Contributors</p>
                            </div>
                        </div>
                    </>
                )}
                <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs">View Profile</Button>
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs"><Share2 className="h-3 w-3 mr-1"/> Share</Button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}