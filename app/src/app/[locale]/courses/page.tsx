"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code2,
  Clock,
  Users,
  Star,
  ChevronRight,
  Search,
  BookOpen,
  Zap,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getCourses } from "@/lib/data/courses";
import type { Course } from "@/lib/sanity/types";
import { Header } from "@/components/navigation/Header";

const levelConfig = {
  beginner: { color: "bg-green-500", textColor: "text-green-500", borderColor: "border-green-500/30" },
  intermediate: { color: "bg-yellow-500", textColor: "text-yellow-500", borderColor: "border-yellow-500/30" },
  advanced: { color: "bg-red-500", textColor: "text-red-500", borderColor: "border-red-500/30" }
};

function CourseCard({ course }: { course: Course }) {
  const t = useTranslations("courses");
  const level = levelConfig[course.level as keyof typeof levelConfig];
  const slug = typeof course.slug === 'string' ? course.slug : course.slug.current;

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${level.borderColor} overflow-hidden`}>
      <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <Code2 className="h-16 w-16 text-primary/30" />
      </div>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge className={level.color}>{t(`levels.${course.level}`)}</Badge>
          {course.featured && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
              <Star className="h-3 w-3 mr-1 fill-yellow-500" />
              {t("featured")}
            </Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {course.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 mb-4">
          {course.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.duration}
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {course.lessonsCount} {t("lessons")}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {course.studentsCount?.toLocaleString()}
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-yellow-500" />
            {course.xpReward} XP
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className="font-medium">{course.rating}</span>
        </div>
        <Button asChild size="sm" className="gap-1">
          <Link href={`/courses/${slug}`}>
            {t("startCourse")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function CoursesPage() {
  const t = useTranslations("courses");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
      setLoading(false);
    };
    loadCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesFilter = filter === "all" || course.level === filter;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const featuredCourses = filteredCourses.filter(c => c.featured);
  const regularCourses = filteredCourses.filter(c => !c.featured);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="container py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {t("title")}
          </h1>
          <p className="text-muted-foreground max-w-2xl mb-8">
            {t("subtitle")}
          </p>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">{t("filters.all")}</TabsTrigger>
                <TabsTrigger value="beginner" className="text-green-600">{t("levels.beginner")}</TabsTrigger>
                <TabsTrigger value="intermediate" className="text-yellow-600">{t("levels.intermediate")}</TabsTrigger>
                <TabsTrigger value="advanced" className="text-red-600">{t("levels.advanced")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <main className="container py-8 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {featuredCourses.length > 0 && filter === "all" && !searchQuery && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-xl font-semibold">{t("featuredCourses")}</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredCourses.map((course) => (
                    <CourseCard key={course._id} course={course} />
                  ))}
                </div>
              </section>
            )}

            {/* All Courses */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {filter === "all" && !searchQuery ? t("allCourses") : `${filteredCourses.length} ${t("coursesFound")}`}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {filteredCourses.length} {t("courses")}
                </span>
              </div>

              {filteredCourses.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {t("noCoursesFound")}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => { setFilter("all"); setSearchQuery(""); }}
                  >
                    {t("clearFilters")}
                  </Button>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(filter === "all" && !searchQuery ? regularCourses : filteredCourses).map((course) => (
                    <CourseCard key={course._id} course={course} />
                  ))}
                </div>
              )}
            </section>

            {/* Learning Path Suggestion */}
            <section className="mt-16 p-8 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{t("notSureWhereToStart")}</h3>
                  <p className="text-muted-foreground">
                    {t("takeAssessmentDescription")}
                  </p>
                </div>
                <Button size="lg" className="gap-2 shrink-0">
                  <Zap className="h-4 w-4" />
                  {t("takeAssessment")}
                </Button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Superteam Academy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("footer.builtBy")}
          </p>
        </div>
      </footer>
    </div>
  );
}
