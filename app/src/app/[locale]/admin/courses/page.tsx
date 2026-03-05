"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("AdminCourses");

  useEffect(() => {
    fetch("/api/admin/courses")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setCourses(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/admin/courses/new">
          <Button className="border border-cyan-300/30 bg-gradient-to-r from-cyan-700 to-blue-700"><Plus className="mr-2 h-4 w-4" /> {t("create")}</Button>
        </Link>
      </div>

      <Card className="border-white/10 bg-black/25 backdrop-blur-md">
        <CardHeader>
          <CardTitle>{t("registry")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableTitle")}</TableHead>
                <TableHead>{t("tableSlug")}</TableHead>
                <TableHead>{t("tableStatus")}</TableHead>
                <TableHead>{t("tableModules")}</TableHead>
                <TableHead className="text-right">{t("tableActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : courses.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("empty")}</TableCell></TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell className="font-mono text-xs">{course.slug}</TableCell>
                    <TableCell>
                      {course.status === "APPROVED" ? (
                        <Badge className="bg-green-500/10 text-green-500">{t("published")}</Badge>
                      ) : course.status === "PENDING" ? (
                        <Badge className="bg-yellow-500/10 text-yellow-500">{t("inReview")}</Badge>
                      ) : course.status === "REJECTED" ? (
                        <Badge variant="destructive">{t("rejected")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("draft")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{course.modules?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/courses/${course.slug}`}>
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
