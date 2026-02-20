"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
	BarChart3,
	Users,
	BookOpen,
	Trophy,
	TrendingUp,
	Shield,
	Plus,
	Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
	totalUsers: number;
	activeUsers: number;
	adminCount: number;
	totalEnrollments: number;
	totalCourses: number;
	publishedCourses: number;
}

export default function AdminDashboard() {
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchStats = useCallback(async () => {
		try {
			const res = await fetch("/api/admin/stats");
			if (res.ok) {
				setStats(await res.json());
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Admin Dashboard</h1>
					<p className="text-muted-foreground">Platform overview and management</p>
				</div>
				<Button asChild>
					<Link href="/admin/courses/new">
						<Plus className="h-4 w-4 mr-2" />
						New Course
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Users</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{s.totalUsers.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">
							{s.totalEnrollments.toLocaleString()} enrolled in courses
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Users (30d)</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{s.activeUsers.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">
							{s.totalUsers > 0
								? `${Math.round((s.activeUsers / s.totalUsers) * 100)}% of total`
								: "No users yet"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Courses</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{s.totalCourses}</div>
						<p className="text-xs text-muted-foreground">
							{s.publishedCourses} published
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Admins</CardTitle>
						<Shield className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{s.adminCount}</div>
						<p className="text-xs text-muted-foreground">Platform administrators</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Enrollments</CardTitle>
						<Trophy className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{s.totalEnrollments.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							Users with active enrollments
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Draft Courses</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{s.totalCourses - s.publishedCourses}
						</div>
						<p className="text-xs text-muted-foreground">Awaiting publication</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button variant="outline" className="w-full justify-start" asChild>
							<Link href="/admin/courses/new">
								<Plus className="h-4 w-4 mr-2" />
								Create New Course
							</Link>
						</Button>
						<Button variant="outline" className="w-full justify-start" asChild>
							<Link href="/admin/users">
								<Users className="h-4 w-4 mr-2" />
								Manage Users
							</Link>
						</Button>
						<Button variant="outline" className="w-full justify-start" asChild>
							<Link href="/admin/admins">
								<Shield className="h-4 w-4 mr-2" />
								Manage Admin Team
							</Link>
						</Button>
						<Button variant="outline" className="w-full justify-start" asChild>
							<Link href="/admin/courses">
								<BookOpen className="h-4 w-4 mr-2" />
								View All Courses
							</Link>
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Platform Status</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-sm">Sanity CMS</span>
							<Badge variant="secondary" className="text-green-600">
								Connected
							</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm">User Registration</span>
							<Badge variant="secondary" className="text-green-600">
								Open
							</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm">Total Courses</span>
							<Badge variant="secondary">{s.totalCourses} courses</Badge>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
