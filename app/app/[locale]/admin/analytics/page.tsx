"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Users, BookOpen, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AnalyticsData {
	totalUsers: number;
	activeUsers: number;
	adminCount: number;
	totalEnrollments: number;
	totalCourses: number;
	publishedCourses: number;
}

interface CourseRow {
	_id: string;
	title: string;
	level: string;
	published: boolean;
	xpReward: number;
	moduleCount?: number;
	lessonCount?: number;
}

export default function AdminAnalyticsPage() {
	const [stats, setStats] = useState<AnalyticsData | null>(null);
	const [courses, setCourses] = useState<CourseRow[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchData = useCallback(async () => {
		try {
			const [statsRes, coursesRes] = await Promise.all([
				fetch("/api/admin/stats"),
				fetch("/api/admin/courses"),
			]);
			if (statsRes.ok) setStats(await statsRes.json());
			if (coursesRes.ok) {
				const data = (await coursesRes.json()) as { courses: CourseRow[] };
				setCourses(data.courses);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (loading) {
		return (
			<div className="p-6 space-y-6">
				<div className="space-y-2">
					<div className="h-8 w-32 bg-muted animate-pulse rounded-lg" />
					<div className="h-4 w-56 bg-muted animate-pulse rounded-lg" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
					))}
				</div>
				<div className="h-64 bg-muted animate-pulse rounded-xl" />
			</div>
		);
	}

	const s = stats ?? {
		totalUsers: 0,
		activeUsers: 0,
		adminCount: 0,
		totalEnrollments: 0,
		totalCourses: 0,
		publishedCourses: 0,
	};

	const retentionRate = s.totalUsers > 0 ? Math.round((s.activeUsers / s.totalUsers) * 100) : 0;
	const enrollmentRate =
		s.totalUsers > 0 ? Math.round((s.totalEnrollments / s.totalUsers) * 100) : 0;
	const publishRate =
		s.totalCourses > 0 ? Math.round((s.publishedCourses / s.totalCourses) * 100) : 0;

	const totalLessons = courses.reduce((sum, c) => sum + (c.lessonCount ?? 0), 0);
	const totalModules = courses.reduce((sum, c) => sum + (c.moduleCount ?? 0), 0);

	const byLevel = {
		beginner: courses.filter((c) => c.level === "beginner").length,
		intermediate: courses.filter((c) => c.level === "intermediate").length,
		advanced: courses.filter((c) => c.level === "advanced").length,
	};

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Analytics</h1>
				<p className="text-muted-foreground">Platform metrics and insights</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Users</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{s.totalUsers.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">
							{s.activeUsers} active in last 30 days
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Retention (30d)</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{retentionRate}%</div>
						<Progress value={retentionRate} className="mt-2" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Enrollment Rate</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{enrollmentRate}%</div>
						<Progress value={enrollmentRate} className="mt-2" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Publish Rate</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{publishRate}%</div>
						<Progress value={publishRate} className="mt-2" />
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Content Overview</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-sm">Total Courses</span>
							<span className="font-medium">{s.totalCourses}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm">Published</span>
							<Badge variant="secondary" className="text-green-600">
								{s.publishedCourses}
							</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm">Drafts</span>
							<Badge variant="outline">{s.totalCourses - s.publishedCourses}</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm">Total Modules</span>
							<span className="font-medium">{totalModules}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm">Total Lessons</span>
							<span className="font-medium">{totalLessons}</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Course Distribution</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<div className="flex items-center justify-between mb-1">
								<span className="text-sm">Beginner</span>
								<span className="text-sm font-medium">{byLevel.beginner}</span>
							</div>
							<Progress
								value={
									s.totalCourses > 0
										? (byLevel.beginner / s.totalCourses) * 100
										: 0
								}
							/>
						</div>
						<div>
							<div className="flex items-center justify-between mb-1">
								<span className="text-sm">Intermediate</span>
								<span className="text-sm font-medium">{byLevel.intermediate}</span>
							</div>
							<Progress
								value={
									s.totalCourses > 0
										? (byLevel.intermediate / s.totalCourses) * 100
										: 0
								}
							/>
						</div>
						<div>
							<div className="flex items-center justify-between mb-1">
								<span className="text-sm">Advanced</span>
								<span className="text-sm font-medium">{byLevel.advanced}</span>
							</div>
							<Progress
								value={
									s.totalCourses > 0
										? (byLevel.advanced / s.totalCourses) * 100
										: 0
								}
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
