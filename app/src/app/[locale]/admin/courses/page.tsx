"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Database } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Используем наш API для получения списка
    fetch('/api/admin/courses')
      .then(res => res.json())
      .then(data => {
          if (!data.error) setCourses(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Manage Courses</h1>
            <p className="text-muted-foreground">Create and publish content to the blockchain.</p>
        </div>
        <Link href="/admin/courses/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create New Course</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Course Registry (Database)</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Modules</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                    ) : courses.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No courses found.</TableCell></TableRow>
                    ) : courses.map(course => (
                        <TableRow key={course.id}>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell className="font-mono text-xs">{course.slug}</TableCell>
                            <TableCell>
                                {course.isPublished ? (
                                    <Badge className="bg-green-500/10 text-green-500">Published</Badge>
                                ) : (
                                    <Badge variant="secondary">Draft</Badge>
                                )}
                            </TableCell>
                            <TableCell>{course.modules?.length || 0}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" disabled title="Edit logic coming soon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}