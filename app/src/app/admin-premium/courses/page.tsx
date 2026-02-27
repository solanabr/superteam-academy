'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BookOpen,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  _id: string;
  id: string;
  slug: string;
  title: string;
  description?: string;
  thumbnail?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
  lessonsCount?: number;
  modulesCount?: number;
  track?: string;
  published?: boolean;
  created_at?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [track, setTrack] = useState<string>('all');
  const [tracks, setTracks] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchCourses = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '20');
        if (search) params.set('search', search);
        if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);
        if (track && track !== 'all') params.set('track', track);

        const res = await fetch(`/api/admin/courses?${params.toString()}`);
        const data = await res.json();

        if (res.ok) {
          setCourses(data.courses || []);
          setPagination(data.pagination);
          if (data.filters?.tracks) {
            setTracks(data.filters.tracks);
          }
        } else {
          toast.error(data.error || 'Failed to fetch courses');
        }
      } catch (error) {
        toast.error('Failed to fetch courses');
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    },
    [search, difficulty, track]
  );

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses(1);
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseToDelete.slug}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Course deleted successfully');
        fetchCourses();
      } else {
        toast.error(data.error || 'Failed to delete course');
      }
    } catch (error) {
      toast.error('Failed to delete course');
      console.error('Error deleting course:', error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const togglePublish = async (course: Course) => {
    try {
      const res = await fetch(`/api/admin/courses/${course.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !course.published }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.course.published ? 'Course published' : 'Course unpublished');
        fetchCourses();
      } else {
        toast.error(data.error || 'Failed to update course');
      }
    } catch (error) {
      toast.error('Failed to update course');
      console.error('Error updating course:', error);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'beginner':
        return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-600 border-red-500/30';
      default:
        return '';
    }
  };

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin-premium">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <BookOpen className="text-primary h-7 w-7" />
              Course Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, edit, and manage courses with modules and lessons.
            </p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin-premium/courses/new">
            <Plus className="h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </div>
            {isMounted ? (
              <>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                {tracks.length > 0 && (
                  <Select value={track} onValueChange={setTrack}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Track" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tracks</SelectItem>
                      {tracks.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            ) : (
              <>
                <div className="border-input bg-background text-muted-foreground flex h-10 w-[150px] items-center rounded-md border px-3 text-sm">
                  Difficulty
                </div>
                {tracks.length > 0 && (
                  <div className="border-input bg-background text-muted-foreground flex h-10 w-[150px] items-center rounded-md border px-3 text-sm">
                    Track
                  </div>
                )}
              </>
            )}
            <Button type="button" variant="outline" size="icon" onClick={() => fetchCourses()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Course Table */}
      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
          <CardDescription>
            {pagination ? `Showing ${courses.length} of ${pagination.total} courses` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
              <BookOpen className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">No courses found</p>
              <p className="text-sm">Create your first course to get started.</p>
              <Button asChild className="mt-4 gap-2">
                <Link href="/admin-premium/courses/new">
                  <Plus className="h-4 w-4" />
                  Create Course
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead>Track</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course._id || course.slug}>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <p className="truncate font-medium">{course.title}</p>
                          <p className="text-muted-foreground truncate text-sm">/{course.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                          {course.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>{course.modulesCount || 0}</TableCell>
                      <TableCell>{course.lessonsCount || 0}</TableCell>
                      <TableCell>
                        {course.track ? (
                          <Badge variant="secondary">{course.track}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {course.published ? (
                          <Badge className="bg-green-500/20 text-green-600">Published</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin-premium/courses/${course.slug}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/courses/${course.slug}`} target="_blank">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePublish(course)}>
                              {course.published ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setCourseToDelete(course);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchCourses(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchCourses(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{courseToDelete?.title}&quot;? This action
              cannot be undone and will remove all associated modules and lessons.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
