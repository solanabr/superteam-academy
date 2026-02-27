"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@superteam-academy/i18n/navigation";
import {
	BookOpen,
	Plus,
	Pencil,
	Trash2,
	Eye,
	ChevronRight,
	Code2,
	Loader2,
	RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CourseRow {
	_id: string;
	title: string;
	slug?: { current: string };
	level: string;
	published: boolean;
	xpReward: number;
	onchainStatus?: string;
	moduleCount?: number;
	lessonCount?: number;
	_createdAt: string;
}

export default function AdminCoursesPage() {
	const [courses, setCourses] = useState<CourseRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [reconciling, setReconciling] = useState(false);
	const [reconcileMessage, setReconcileMessage] = useState<string | null>(null);

	const fetchCourses = useCallback(async () => {
		try {
			const res = await fetch("/api/admin/courses");
			if (res.ok) {
				const data = (await res.json()) as { courses: CourseRow[] };
				setCourses(data.courses);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchCourses();
	}, [fetchCourses]);

	const handleDelete = async (courseId: string) => {
		const res = await fetch(`/api/admin/courses/${courseId}`, {
			method: "DELETE",
		});
		if (res.ok) {
			setCourses((prev) => prev.filter((c) => c._id !== courseId));
		}
	};

	const togglePublish = async (courseId: string, published: boolean) => {
		const res = await fetch(`/api/admin/courses/${courseId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ published: !published }),
		});
		if (res.ok) {
			setCourses((prev) =>
				prev.map((c) => (c._id === courseId ? { ...c, published: !published } : c))
			);
		}
	};

	const handleReconcile = async () => {
		setReconciling(true);
		setReconcileMessage(null);
		try {
			const res = await fetch("/api/admin/courses/reconcile", { method: "POST" });
			const payload = (await res.json()) as {
				report?: { changed: number; failed: number };
				error?: string;
			};

			if (!res.ok) {
				setReconcileMessage(payload.error ?? "Failed to reconcile index");
				return;
			}

			await fetchCourses();
			const changed = payload.report?.changed ?? 0;
			const failed = payload.report?.failed ?? 0;
			setReconcileMessage(
				failed > 0
					? `Reconcile completed with ${failed} failures (${changed} changed).`
					: `Reconcile completed (${changed} changed).`
			);
		} catch {
			setReconcileMessage("Failed to reconcile index");
		} finally {
			setReconciling(false);
		}
	};

	if (loading) {
		return (
			<div className="p-6 space-y-6">
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<div className="h-8 w-52 bg-muted animate-pulse rounded-lg" />
						<div className="h-4 w-36 bg-muted animate-pulse rounded-lg" />
					</div>
					<div className="h-10 w-28 bg-muted animate-pulse rounded-lg" />
				</div>
				<div className="space-y-3">
					<div className="h-10 bg-muted animate-pulse rounded-lg" />
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Course Management</h1>
					<p className="text-muted-foreground">
						{courses.length} course{courses.length !== 1 ? "s" : ""} total
					</p>
					{reconcileMessage && (
						<p className="text-sm text-muted-foreground mt-1">{reconcileMessage}</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={handleReconcile} disabled={reconciling}>
						{reconciling ? (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<RefreshCw className="h-4 w-4 mr-2" />
						)}
						Reconcile Index
					</Button>
					<Button asChild>
						<Link href="/admin/courses/new">
							<Plus className="h-4 w-4 mr-2" />
							New Course
						</Link>
					</Button>
				</div>
			</div>

			{courses.length === 0 ? (
				<Card>
					<CardContent className="py-16 text-center">
						<BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium mb-2">No courses yet</h3>
						<p className="text-muted-foreground mb-4">
							Create your first course to get started.
						</p>
						<Button asChild>
							<Link href="/admin/courses/new">
								<Plus className="h-4 w-4 mr-2" />
								Create Course
							</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>All Courses</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Title</TableHead>
									<TableHead>Level</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>On-chain</TableHead>
									<TableHead className="text-right">XP</TableHead>
									<TableHead className="text-right">Modules</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{courses.map((course) => (
									<TableRow key={course._id}>
										<TableCell className="font-medium">
											<Link
												href={`/admin/courses/${course._id}`}
												className="hover:underline flex items-center gap-1"
											>
												{course.title}
												<ChevronRight className="h-3 w-3" />
											</Link>
										</TableCell>
										<TableCell>
											<Badge variant="outline" className="capitalize">
												{course.level}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant={course.published ? "default" : "secondary"}
												className="cursor-pointer"
												onClick={() =>
													togglePublish(course._id, course.published)
												}
											>
												{course.published ? "Published" : "Draft"}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={
													course.onchainStatus === "succeeded"
														? "text-green-600"
														: course.onchainStatus === "failed"
															? "text-red-600"
															: "text-yellow-600"
												}
											>
												{course.onchainStatus ?? "draft"}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											{course.xpReward}
										</TableCell>
										<TableCell className="text-right">
											{course.moduleCount ?? 0}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-1">
												<Button variant="ghost" size="icon" asChild>
													<Link
														href={`/courses/${course.slug?.current ?? course._id}`}
													>
														<Eye className="h-4 w-4" />
													</Link>
												</Button>
												<Button variant="ghost" size="icon" asChild>
													<Link
														href={`/admin/courses/${course._id}/content`}
													>
														<Code2 className="h-4 w-4" />
													</Link>
												</Button>
												<Button variant="ghost" size="icon" asChild>
													<Link href={`/admin/courses/${course._id}`}>
														<Pencil className="h-4 w-4" />
													</Link>
												</Button>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button variant="ghost" size="icon">
															<Trash2 className="h-4 w-4 text-destructive" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>
																Delete &quot;{course.title}&quot;?
															</AlertDialogTitle>
															<AlertDialogDescription>
																This will permanently delete the
																course and all its modules and
																lessons.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>
																Cancel
															</AlertDialogCancel>
															<AlertDialogAction
																onClick={() =>
																	handleDelete(course._id)
																}
															>
																Delete
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
