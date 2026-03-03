// app/src/app/[locale]/(dashboard)/creator/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Loader2, MessageSquareWarning } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function CreatorDashboardPage() {
  const { userDb } = useUser();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userDb?.id) {
        // Мы создадим этот API на следующем шаге
        fetch(`/api/creator/courses?authorId=${userDb.id}`)
          .then(res => res.json())
          .then(data => {
              if (!data.error) setCourses(data);
          })
          .finally(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, [userDb]);

  const getStatusBadge = (status: string) => {
      switch (status) {
          case 'APPROVED': return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Published</Badge>;
          case 'PENDING': return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">In Review</Badge>;
          case 'REJECTED': return <Badge variant="destructive">Needs Changes</Badge>;
          default: return <Badge variant="secondary">Draft</Badge>; // DRAFT
      }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground">Create content and share your knowledge with the community.</p>
        </div>
        <Link href="/creator/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create New Course</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Your Curriculum Registry</CardTitle>
            <CardDescription>Manage your drafts and track publication status.</CardDescription>
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
                        <TableRow><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                    ) : courses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                You haven&apos;t created any courses yet.
                            </TableCell>
                        </TableRow>
                    ) : courses.map(course => (
                        <TableRow key={course.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {course.title}
                                    {/* Если отклонен, показываем причину в тултипе */}
                                    {course.status === 'REJECTED' && course.reviewComment && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger><MessageSquareWarning className="h-4 w-4 text-red-500" /></TooltipTrigger>
                                                <TooltipContent className="bg-destructive text-destructive-foreground">
                                                    <p>{course.reviewComment}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{course.slug}</TableCell>
                            <TableCell>
                                {getStatusBadge(course.status)}
                            </TableCell>
                            <TableCell>{course.modules?.length || 0}</TableCell>
                            <TableCell className="text-right">
                                <Link href={`/creator/${course.slug}`}>
                                    <Button variant="ghost" size="sm">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </Link>
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