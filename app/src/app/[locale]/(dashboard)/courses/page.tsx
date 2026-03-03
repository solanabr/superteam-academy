// app/src/app/(dashboard)/courses/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useProgram } from "@/hooks/useProgram";
import { useUser } from "@/hooks/useUser"; // Импортируем useUser для проверки записи
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "@/i18n/navigation";
import { Search, Filter } from "lucide-react";
import Image from "next/image"

export default function CoursesPage() {
  const { fetchCourses } = useProgram();
  const { enrollments } = useUser(); // Получаем список enrolled courses
  const router = useRouter();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Состояние фильтров
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  useEffect(() => {
    const loadAll = async () => {
        try {
            const chainCourses = await fetchCourses();
            setCourses(chainCourses);

            // Получаем доп. инфу из нашей БД (описание и т.д.)
            const res = await fetch('/api/admin/courses'); // Публичный API или переиспользуем админский
            const data = await res.json();
            if (!data.error) setDbCourses(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    loadAll();
  }, [fetchCourses]);

  // Фильтрация
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
        const matchesSearch = course.account.courseId.toLowerCase().includes(searchQuery.toLowerCase());
        // В будущем можно добавить поле difficulty в Course Account, пока эмулируем
        const matchesDifficulty = difficultyFilter === "all" || true; 
        return matchesSearch && matchesDifficulty;
    });
  }, [courses, searchQuery, difficultyFilter]);

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Explore Courses</h2>
            <p className="text-muted-foreground mt-1">
                Discover {courses.length} interactive courses to master Solana.
            </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search courses..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
      
      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((chainCourse) => {
            const courseId = chainCourse.account.courseId;
            // Ищем обогащенные данные из БД
            const dbCourse = dbCourses.find(c => c.slug === courseId);
            
            // Проверяем запись
            // @ts-ignore
            const myEnrollment = enrollments.find(e => e.courseId === courseId);
            const isEnrolled = !!myEnrollment;
            const progress = myEnrollment?.progressPercent || 0;
            const isCompleted = progress === 100;
            
            return (
                <Card key={courseId} className="flex flex-col justify-between overflow-hidden hover:shadow-lg transition-all hover:border-primary/50 group cursor-pointer" onClick={() => handleCourseClick(courseId)}>
                  
                  <div className="h-32 relative bg-muted flex items-center justify-center">
                      {/* Если в БД есть картинка - показываем, иначе градиент */}
                      {dbCourse?.imageUrl ? (
                          <Image src={dbCourse.imageUrl} alt={courseId} fill className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800" />
                      )}
                      
                      <div className="absolute top-4 right-4">
                          <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur border-white/10">
                              {chainCourse.account.lessonCount} Lessons
                          </Badge>
                      </div>
                      <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white drop-shadow-md z-10">{dbCourse?.title || courseId}</h3>
                  </div>

                  <CardContent className="pt-6">
                    <CardDescription className="line-clamp-2 mb-4 h-10">
                      {dbCourse?.description || "Master the fundamentals of Solana development with this interactive course."}
                    </CardDescription>
                    
                    <div className="flex gap-2 mb-4">
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10">
                            {chainCourse.account.xpPerLesson.toString()} XP/lesson
                        </Badge>
                        <Badge variant="outline">{dbCourse?.difficulty || "Beginner"}</Badge>
                    </div>

                    {isEnrolled && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                                <span className={isCompleted ? "text-green-500" : "text-muted-foreground"}>
                                    {isCompleted ? "Completed" : "Progress"}
                                </span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" aria-label="Course progress" />
                        </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button 
                        className="w-full group-hover:bg-primary transition-colors" 
                        variant={isEnrolled ? (isCompleted ? "outline" : "secondary") : "default"}
                    >
                        {isCompleted ? "Review Course" : (isEnrolled ? "Continue Learning" : "Start Learning")}
                    </Button>
                  </CardFooter>
                </Card>
            );
          })
        ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
                No courses found matching your criteria.
            </div>
        )}
      </div>
    </div>
  );
}