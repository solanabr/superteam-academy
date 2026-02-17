"use client";

import { useState } from "react";
import { BarChart3, Users, BookOpen, Trophy, TrendingUp, Settings, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";

interface DashboardStats {
	totalUsers: number;
	activeUsers: number;
	totalCourses: number;
	completedCourses: number;
	totalXP: number;
	totalCredentials: number;
}

interface RecentActivity {
	id: string;
	type: "enrollment" | "completion" | "achievement" | "credential";
	user: string;
	course?: string;
	timestamp: string;
}

export default function AdminDashboard() {
	const t = useTranslations("admin");
	const [stats] = useState<DashboardStats>({
		totalUsers: 15_420,
		activeUsers: 8920,
		totalCourses: 45,
		completedCourses: 12_890,
		totalXP: 2_456_780,
		totalCredentials: 5670,
	});

	const [recentActivity] = useState<RecentActivity[]>([
		{
			id: "1",
			type: "completion",
			user: "João Silva",
			course: "Solana Fundamentals",
			timestamp: "2024-02-16T10:30:00Z",
		},
		{
			id: "2",
			type: "achievement",
			user: "Maria Santos",
			timestamp: "2024-02-16T09:45:00Z",
		},
		{
			id: "3",
			type: "enrollment",
			user: "Carlos Oliveira",
			course: "Anchor Development",
			timestamp: "2024-02-16T09:15:00Z",
		},
		{
			id: "4",
			type: "credential",
			user: "Ana Costa",
			course: "Web3 Security",
			timestamp: "2024-02-16T08:30:00Z",
		},
	]);

	const getActivityIcon = (type: RecentActivity["type"]) => {
		switch (type) {
			case "enrollment":
				return <BookOpen className="h-4 w-4" />;
			case "completion":
				return <Trophy className="h-4 w-4" />;
			case "achievement":
				return <TrendingUp className="h-4 w-4" />;
			case "credential":
				return <Shield className="h-4 w-4" />;
			default:
				return null;
		}
	};

	const getActivityColor = (type: RecentActivity["type"]) => {
		switch (type) {
			case "enrollment":
				return "text-blue-600";
			case "completion":
				return "text-green-600";
			case "achievement":
				return "text-purple-600";
			case "credential":
				return "text-orange-600";
			default:
				return "text-gray-600";
		}
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
					<p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
				</div>
				<Button>
					<Settings className="h-4 w-4 mr-2" />
					{t("dashboard.settings")}
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("dashboard.totalUsers")}
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.totalUsers.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							+12% {t("dashboard.fromLastMonth")}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("dashboard.activeUsers")}
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.activeUsers.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							+8% {t("dashboard.fromLastMonth")}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("dashboard.totalCourses")}
						</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalCourses}</div>
						<p className="text-xs text-muted-foreground">
							{stats.completedCourses.toLocaleString()} {t("dashboard.completions")}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("dashboard.totalXP")}
						</CardTitle>
						<Trophy className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalXP.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">
							+15% {t("dashboard.fromLastMonth")}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("dashboard.credentials")}
						</CardTitle>
						<Shield className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.totalCredentials.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							+22% {t("dashboard.fromLastMonth")}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("dashboard.completionRate")}
						</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">83%</div>
						<Progress value={83} className="mt-2" />
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="overview">{t("dashboard.tabs.overview")}</TabsTrigger>
					<TabsTrigger value="users">{t("dashboard.tabs.users")}</TabsTrigger>
					<TabsTrigger value="courses">{t("dashboard.tabs.courses")}</TabsTrigger>
					<TabsTrigger value="analytics">{t("dashboard.tabs.analytics")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("dashboard.recentActivity")}</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{recentActivity.map((activity) => (
										<div
											key={activity.id}
											className="flex items-center space-x-4"
										>
											<div
												className={`p-2 rounded-full bg-muted ${getActivityColor(activity.type)}`}
											>
												{getActivityIcon(activity.type)}
											</div>
											<div className="flex-1 space-y-1">
												<p className="text-sm font-medium leading-none">
													{activity.user}
												</p>
												<p className="text-sm text-muted-foreground">
													{activity.type === "enrollment" &&
														t("dashboard.activity.enrolled", {
															course: activity.course ?? "",
														})}
													{activity.type === "completion" &&
														t("dashboard.activity.completed", {
															course: activity.course ?? "",
														})}
													{activity.type === "achievement" &&
														t("dashboard.activity.achievement")}
													{activity.type === "credential" &&
														t("dashboard.activity.credential", {
															course: activity.course ?? "",
														})}
												</p>
											</div>
											<div className="text-xs text-muted-foreground">
												{new Date(activity.timestamp).toLocaleTimeString()}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{t("dashboard.systemHealth")}</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-sm">{t("dashboard.apiHealth")}</span>
									<Badge variant="secondary" className="text-green-600">
										Healthy
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">{t("dashboard.database")}</span>
									<Badge variant="secondary" className="text-green-600">
										Healthy
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">{t("dashboard.blockchain")}</span>
									<Badge variant="secondary" className="text-yellow-600">
										Degraded
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">{t("dashboard.cdn")}</span>
									<Badge variant="secondary" className="text-green-600">
										Healthy
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">{t("dashboard.uptime")}</span>
									<span className="text-sm font-medium">99.8%</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="users" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("dashboard.userManagement")}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-center py-8">
								<Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">
									{t("dashboard.userManagementTitle")}
								</h3>
								<p className="text-muted-foreground mb-4">
									{t("dashboard.userManagementDesc")}
								</p>
								<Button>{t("dashboard.manageUsers")}</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="courses" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("dashboard.courseManagement")}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-center py-8">
								<BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">
									{t("dashboard.courseManagementTitle")}
								</h3>
								<p className="text-muted-foreground mb-4">
									{t("dashboard.courseManagementDesc")}
								</p>
								<Button>{t("dashboard.manageCourses")}</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="analytics" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("dashboard.analytics")}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-center py-8">
								<BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">
									{t("dashboard.analyticsTitle")}
								</h3>
								<p className="text-muted-foreground mb-4">
									{t("dashboard.analyticsDesc")}
								</p>
								<Button>{t("dashboard.viewAnalytics")}</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
