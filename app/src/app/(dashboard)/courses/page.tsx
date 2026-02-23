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
import { useRouter } from "next/navigation";
import { Search, Filter } from "lucide-react";

export default function CoursesPage() {
  const { fetchCourses } = useProgram();
  const { enrollments } = useUser(); // Получаем список enrolled courses
  const router = useRouter();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Состояние фильтров
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  useEffect(() => {
    fetchCourses().then((data) => {
      setCourses(data);
      setLoading(false);
    });
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
          filteredCourses.map((course) => {
            // Проверяем запись через хук useUser
            // @ts-ignore
            const isEnrolled = enrollments.some(e => e.courseId === course.account.courseId);
            
            return (
                <Card key={course.publicKey.toString()} className="flex flex-col justify-between overflow-hidden hover:shadow-lg transition-all hover:border-purple-500/50 group cursor-pointer" onClick={() => handleCourseClick(course.account.courseId)}>
                  
                  {/* Имитация обложки курса */}
                  <div className="h-32 bg-gradient-to-r from-gray-900 to-gray-800 relative p-6 flex flex-col justify-end group-hover:from-purple-900/40 group-hover:to-blue-900/40 transition-colors">
                      <div className="absolute top-4 right-4">
                          <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur">
                              {course.account.lessonCount} Lessons
                          </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-wide">{course.account.courseId}</h3>
                  </div>

                  <CardContent className="pt-6">
                    <CardDescription className="line-clamp-2 mb-4">
                      Learn the fundamentals of {course.account.courseId}. Master accounts, instructions, and CPIS.
                    </CardDescription>
                    
                    {/* Метаданные */}
                    <div className="flex gap-2 mb-4">
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                            {course.account.xpPerLesson.toString()} XP
                        </Badge>
                        <Badge variant="outline">Rust</Badge>
                    </div>

                    {/* Прогресс бар, если записан (пока фейковый 0%, можно допилить) */}
                    {isEnrolled && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>In Progress</span>
                            </div>
                            <Progress value={10} className="h-1.5" />
                        </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button 
                        className="w-full group-hover:bg-purple-600 transition-colors" 
                        variant={isEnrolled ? "secondary" : "default"}
                    >
                        {isEnrolled ? "Continue Learning" : "Start Learning"}
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