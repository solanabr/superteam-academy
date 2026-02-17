/**
 * Security Training Component
 * Implements security awareness training and education programs
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	GraduationCap,
	BookOpen,
	Trophy,
	Users,
	TrendingUp,
	TrendingDown,
	CheckCircle,
	XCircle,
	Clock,
	Play,
	Award,
	Target,
	BarChart3,
	UserCheck,
	AlertTriangle,
	Star,
	StarHalf,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface TrainingProgram {
	id: string;
	title: string;
	description: string;
	type: string;
	duration: number;
	modules: number;
	enrolledUsers: number;
	completionRate: number;
	averageScore: number;
	lastUpdated: Date;
	status: string;
}

interface UserProgressEntry {
	id: string;
	name: string;
	avatar: string;
	email: string;
	overallProgress: number;
	completedCourses: number;
	currentCourse: string;
	lastActivity: Date;
	riskLevel: string;
	certifications: string[];
}

interface UserEngagement {
	high: number;
	medium: number;
	low: number;
}

interface MonthlyProgress {
	month: string;
	completion: number;
}

interface ProgramTypes {
	mandatory: number;
	specialized: number;
	advanced: number;
}

interface TrainingMetrics {
	totalUsers: number;
	enrolledUsers: number;
	completionRate: number;
	averageScore: number;
	activePrograms: number;
	totalPrograms: number;
	certificationsIssued: number;
	trainingHours: number;
	userEngagement: UserEngagement;
	programTypes: ProgramTypes;
	monthlyProgress: MonthlyProgress[];
}

interface SecurityTrainingProps {
	className?: string;
}

export function SecurityTraining({ className = "" }: SecurityTrainingProps) {
	const t = useTranslations("securityTraining");
	const [activeTab, setActiveTab] = useState("overview");
	const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
	const [userProgress, setUserProgress] = useState<UserProgressEntry[]>([]);
	const [trainingMetrics, setTrainingMetrics] = useState<Partial<TrainingMetrics>>({});

	// Mock training data
	useEffect(() => {
		const mockPrograms = [
			{
				id: "1",
				title: "Basic Cybersecurity Awareness",
				description: "Fundamental security concepts and best practices",
				type: "mandatory",
				duration: 45, // minutes
				modules: 5,
				enrolledUsers: 1247,
				completionRate: 0.89,
				averageScore: 85,
				lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				status: "active",
			},
			{
				id: "2",
				title: "Password Security & MFA",
				description:
					"Creating and managing secure passwords with multi-factor authentication",
				type: "mandatory",
				duration: 30,
				modules: 3,
				enrolledUsers: 1247,
				completionRate: 0.94,
				averageScore: 92,
				lastUpdated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
				status: "active",
			},
			{
				id: "3",
				title: "Phishing Awareness",
				description: "Recognizing and responding to phishing attempts",
				type: "mandatory",
				duration: 60,
				modules: 4,
				enrolledUsers: 1247,
				completionRate: 0.76,
				averageScore: 78,
				lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
				status: "active",
			},
			{
				id: "4",
				title: "Data Protection & GDPR",
				description: "Understanding data protection regulations and compliance",
				type: "specialized",
				duration: 90,
				modules: 6,
				enrolledUsers: 234,
				completionRate: 0.67,
				averageScore: 82,
				lastUpdated: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
				status: "active",
			},
			{
				id: "5",
				title: "Advanced Threat Detection",
				description: "Identifying sophisticated cyber threats and attack vectors",
				type: "advanced",
				duration: 120,
				modules: 8,
				enrolledUsers: 89,
				completionRate: 0.45,
				averageScore: 76,
				lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				status: "draft",
			},
		];

		const mockUsers = [
			{
				id: "1",
				name: "Alice Johnson",
				avatar: "/avatars/alice.jpg",
				email: "alice@example.com",
				overallProgress: 95,
				completedCourses: 4,
				currentCourse: "Data Protection & GDPR",
				lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
				riskLevel: "low",
				certifications: ["Basic Cybersecurity", "Password Security"],
			},
			{
				id: "2",
				name: "Bob Smith",
				avatar: "/avatars/bob.jpg",
				email: "bob@example.com",
				overallProgress: 78,
				completedCourses: 3,
				currentCourse: "Phishing Awareness",
				lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
				riskLevel: "medium",
				certifications: ["Basic Cybersecurity"],
			},
			{
				id: "3",
				name: "Charlie Brown",
				avatar: "/avatars/charlie.jpg",
				email: "charlie@example.com",
				overallProgress: 45,
				completedCourses: 1,
				currentCourse: "Basic Cybersecurity Awareness",
				lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
				riskLevel: "high",
				certifications: [],
			},
		];

		const mockMetrics = {
			totalUsers: 15_420,
			enrolledUsers: 1247,
			completionRate: 0.82,
			averageScore: 84,
			activePrograms: 4,
			totalPrograms: 5,
			certificationsIssued: 2894,
			trainingHours: 45_678,
			userEngagement: {
				high: 34,
				medium: 45,
				low: 21,
			},
			programTypes: {
				mandatory: 3,
				specialized: 1,
				advanced: 1,
			},
			monthlyProgress: [
				{ month: "Jan", completion: 85 },
				{ month: "Feb", completion: 87 },
				{ month: "Mar", completion: 89 },
				{ month: "Apr", completion: 84 },
				{ month: "May", completion: 91 },
				{ month: "Jun", completion: 88 },
			],
		};

		setTrainingPrograms(mockPrograms);
		setUserProgress(mockUsers);
		setTrainingMetrics(mockMetrics);
	}, []);

	const typeConfig = {
		mandatory: { color: "bg-red-100 text-red-800", icon: AlertTriangle },
		specialized: { color: "bg-blue-100 text-blue-800", icon: Target },
		advanced: { color: "bg-purple-100 text-purple-800", icon: Star },
	};

	const statusConfig = {
		active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
		draft: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
		archived: { color: "bg-gray-100 text-gray-800", icon: XCircle },
	};

	const riskConfig = {
		low: "bg-green-100 text-green-800",
		medium: "bg-yellow-100 text-yellow-800",
		high: "bg-red-100 text-red-800",
	};

	const getScoreColor = (score: number) => {
		if (score >= 90) return "text-green-600";
		if (score >= 80) return "text-blue-600";
		if (score >= 70) return "text-yellow-600";
		if (score >= 60) return "text-orange-600";
		return "text-red-600";
	};

	const renderStars = (score: number) => {
		const stars: React.ReactNode[] = [];
		const fullStars = Math.floor(score / 20);
		const hasHalfStar = score % 20 >= 10;

		for (let i = 0; i < 5; i++) {
			if (i < fullStars) {
				stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
			} else if (i === fullStars && hasHalfStar) {
				stars.push(
					<StarHalf key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
				);
			} else {
				stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
			}
		}

		return stars;
	};

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center space-x-2">
						<GraduationCap className="h-6 w-6" />
						<span>{t("securityTraining.title")}</span>
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						{t("securityTraining.subtitle")}
					</p>
				</div>
				<div className="flex items-center space-x-4">
					<Button variant="outline" size="sm">
						<BookOpen className="h-4 w-4 mr-2" />
						{t("createProgram")}
					</Button>
					<Badge variant="outline" className="bg-green-50 text-green-700">
						<Users className="h-3 w-3 mr-1" />
						{trainingMetrics.enrolledUsers || 0} {t("enrolled")}
					</Badge>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
					<TabsTrigger value="programs">{t("tabs.programs")}</TabsTrigger>
					<TabsTrigger value="users">{t("tabs.users")}</TabsTrigger>
					<TabsTrigger value="analytics">{t("tabs.analytics")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.completionRate")}
										</p>
										<p className="text-2xl font-bold text-green-600">
											{((trainingMetrics.completionRate || 0) * 100).toFixed(
												1
											)}
											%
										</p>
									</div>
									<Trophy className="h-8 w-8 text-green-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">+5.2%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.vsLastMonth")}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.averageScore")}
										</p>
										<p className="text-2xl font-bold">
											{trainingMetrics.averageScore || 0}%
										</p>
									</div>
									<Award className="h-8 w-8 text-yellow-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">+3.1%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.improvement")}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.certifications")}
										</p>
										<p className="text-2xl font-bold text-blue-600">
											{trainingMetrics.certificationsIssued || 0}
										</p>
									</div>
									<UserCheck className="h-8 w-8 text-blue-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">+12.8%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.growth")}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.trainingHours")}
										</p>
										<p className="text-2xl font-bold text-purple-600">
											{((trainingMetrics.trainingHours || 0) / 1000).toFixed(
												1
											)}
											k
										</p>
									</div>
									<Clock className="h-8 w-8 text-purple-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">+8.4%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.engagement")}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("programOverview.title")}</CardTitle>
							<CardDescription>{t("programOverview.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{trainingPrograms.slice(0, 3).map((program) => {
									const TypeIcon =
										typeConfig[program.type as keyof typeof typeConfig]?.icon ||
										BookOpen;
									const StatusIcon =
										statusConfig[program.status as keyof typeof statusConfig]
											?.icon || CheckCircle;

									return (
										<div key={program.id} className="p-4 border rounded-lg">
											<div className="flex items-center justify-between mb-3">
												<Badge
													className={
														typeConfig[
															program.type as keyof typeof typeConfig
														]?.color
													}
												>
													<TypeIcon className="h-3 w-3 mr-1" />
													{program.type}
												</Badge>
												<Badge
													className={
														statusConfig[
															program.status as keyof typeof statusConfig
														]?.color
													}
												>
													<StatusIcon className="h-3 w-3 mr-1" />
													{program.status}
												</Badge>
											</div>

											<h3 className="font-medium mb-2">{program.title}</h3>
											<p className="text-sm text-gray-600 mb-3">
												{program.description}
											</p>

											<div className="space-y-2">
												<div className="flex items-center justify-between text-sm">
													<span>{t("programOverview.completion")}</span>
													<span className="font-medium">
														{(
															(program.completionRate || 0) * 100
														).toFixed(1)}
														%
													</span>
												</div>
												<Progress
													value={(program.completionRate || 0) * 100}
													className="h-2"
												/>

												<div className="flex items-center justify-between text-sm">
													<span>{t("programOverview.enrolled")}</span>
													<span className="font-medium">
														{program.enrolledUsers}
													</span>
												</div>

												<div className="flex items-center justify-between text-sm">
													<span>{t("programOverview.duration")}</span>
													<span className="font-medium">
														{program.duration}min
													</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{t("userEngagement.title")}</CardTitle>
							<CardDescription>{t("userEngagement.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="text-center">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
										<TrendingUp className="h-8 w-8 text-green-600" />
									</div>
									<div className="text-2xl font-bold text-green-600">
										{trainingMetrics.userEngagement?.high || 0}%
									</div>
									<div className="text-sm text-gray-600">
										{t("userEngagement.high")}
									</div>
								</div>

								<div className="text-center">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
										<BarChart3 className="h-8 w-8 text-yellow-600" />
									</div>
									<div className="text-2xl font-bold text-yellow-600">
										{trainingMetrics.userEngagement?.medium || 0}%
									</div>
									<div className="text-sm text-gray-600">
										{t("userEngagement.medium")}
									</div>
								</div>

								<div className="text-center">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
										<TrendingDown className="h-8 w-8 text-red-600" />
									</div>
									<div className="text-2xl font-bold text-red-600">
										{trainingMetrics.userEngagement?.low || 0}%
									</div>
									<div className="text-sm text-gray-600">
										{t("userEngagement.low")}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="programs" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("programs.title")}</CardTitle>
							<CardDescription>{t("programs.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("programs.table.title")}</TableHead>
										<TableHead>{t("programs.table.type")}</TableHead>
										<TableHead>{t("programs.table.duration")}</TableHead>
										<TableHead>{t("programs.table.completion")}</TableHead>
										<TableHead>{t("programs.table.enrolled")}</TableHead>
										<TableHead>{t("programs.table.status")}</TableHead>
										<TableHead>{t("programs.table.actions")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{trainingPrograms.map((program) => {
										const TypeIcon =
											typeConfig[program.type as keyof typeof typeConfig]
												?.icon || BookOpen;
										const StatusIcon =
											statusConfig[
												program.status as keyof typeof statusConfig
											]?.icon || CheckCircle;

										return (
											<TableRow key={program.id}>
												<TableCell>
													<div>
														<div className="font-medium">
															{program.title}
														</div>
														<div className="text-sm text-gray-500">
															{program.description}
														</div>
													</div>
												</TableCell>
												<TableCell>
													<Badge
														className={
															typeConfig[
																program.type as keyof typeof typeConfig
															]?.color
														}
													>
														<TypeIcon className="h-3 w-3 mr-1" />
														{program.type}
													</Badge>
												</TableCell>
												<TableCell className="text-sm">
													{program.duration}min ({program.modules}{" "}
													modules)
												</TableCell>
												<TableCell>
													<div className="flex items-center space-x-2">
														<span className="text-sm font-medium">
															{(
																(program.completionRate || 0) * 100
															).toFixed(1)}
															%
														</span>
														<div className="w-16 bg-gray-200 rounded-full h-2">
															<div
																className="bg-blue-600 h-2 rounded-full"
																style={{
																	width: `${(program.completionRate || 0) * 100}%`,
																}}
															/>
														</div>
													</div>
												</TableCell>
												<TableCell className="text-sm">
													{program.enrolledUsers}
												</TableCell>
												<TableCell>
													<Badge
														className={
															statusConfig[
																program.status as keyof typeof statusConfig
															]?.color
														}
													>
														<StatusIcon className="h-3 w-3 mr-1" />
														{program.status}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex space-x-2">
														<Button variant="outline" size="sm">
															<Play className="h-4 w-4 mr-1" />
															{t("programs.actions.launch")}
														</Button>
														<Button variant="outline" size="sm">
															<BarChart3 className="h-4 w-4 mr-1" />
															{t("programs.actions.analytics")}
														</Button>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="users" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("users.title")}</CardTitle>
							<CardDescription>{t("users.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("users.table.user")}</TableHead>
										<TableHead>{t("users.table.progress")}</TableHead>
										<TableHead>{t("users.table.completed")}</TableHead>
										<TableHead>{t("users.table.current")}</TableHead>
										<TableHead>{t("users.table.risk")}</TableHead>
										<TableHead>{t("users.table.lastActivity")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{userProgress.map((user) => (
										<TableRow key={user.id}>
											<TableCell>
												<div className="flex items-center space-x-3">
													<Avatar className="h-8 w-8">
														<AvatarImage
															src={user.avatar}
															alt={user.name}
														/>
														<AvatarFallback>
															{user.name
																.split(" ")
																.map((n) => n[0])
																.join("")}
														</AvatarFallback>
													</Avatar>
													<div>
														<div className="font-medium">
															{user.name}
														</div>
														<div className="text-sm text-gray-500">
															{user.email}
														</div>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													<span
														className={`text-sm font-medium ${getScoreColor(user.overallProgress)}`}
													>
														{user.overallProgress}%
													</span>
													<div className="flex">
														{renderStars(user.overallProgress)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													<Trophy className="h-4 w-4 text-yellow-500" />
													<span className="text-sm font-medium">
														{user.completedCourses}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-sm">
												{user.currentCourse}
											</TableCell>
											<TableCell>
												<Badge
													className={
														riskConfig[
															user.riskLevel as keyof typeof riskConfig
														]
													}
												>
													{user.riskLevel}
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-gray-500">
												{user.lastActivity.toLocaleString()}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="analytics" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("analytics.progress.title")}</CardTitle>
								<CardDescription>
									{t("analytics.progress.description")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{trainingMetrics.monthlyProgress?.map((month) => (
										<div
											key={month.month}
											className="flex items-center justify-between"
										>
											<span className="text-sm font-medium">
												{month.month}
											</span>
											<div className="flex items-center space-x-2">
												<div className="w-32 bg-gray-200 rounded-full h-2">
													<div
														className="bg-blue-600 h-2 rounded-full"
														style={{
															width: `${month.completion}%`,
														}}
													/>
												</div>
												<span className="text-sm font-medium w-12 text-right">
													{month.completion}%
												</span>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{t("analytics.distribution.title")}</CardTitle>
								<CardDescription>
									{t("analytics.distribution.description")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{Object.entries(trainingMetrics.programTypes || {}).map(
										([type, count]: [string, number]) => {
											const config =
												typeConfig[type as keyof typeof typeConfig];
											const Icon = config?.icon || BookOpen;

											return (
												<div
													key={type}
													className="flex items-center justify-between"
												>
													<div className="flex items-center space-x-3">
														<Icon
															className={`h-5 w-5 ${config?.color.split(" ")[1] || "text-gray-600"}`}
														/>
														<span className="text-sm capitalize">
															{type}
														</span>
													</div>
													<div className="flex items-center space-x-2">
														<div className="w-24 bg-gray-200 rounded-full h-2">
															<div
																className={`h-2 rounded-full ${config?.color.split(" ")[0] || "bg-gray-500"}`}
																style={{
																	width: `${(count / (trainingMetrics.totalPrograms || 1)) * 100}%`,
																}}
															/>
														</div>
														<span className="text-sm font-medium w-8 text-right">
															{count}
														</span>
													</div>
												</div>
											);
										}
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("analytics.insights.title")}</CardTitle>
							<CardDescription>{t("analytics.insights.description")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Alert>
								<TrendingUp className="h-4 w-4" />
								<AlertDescription>
									<strong>{t("analytics.insights.improvement.title")}</strong>{" "}
									{t("analytics.insights.improvement.description")}
								</AlertDescription>
							</Alert>

							<Alert>
								<Target className="h-4 w-4" />
								<AlertDescription>
									<strong>{t("analytics.insights.engagement.title")}</strong>{" "}
									{t("analytics.insights.engagement.description")}
								</AlertDescription>
							</Alert>

							<Alert>
								<Award className="h-4 w-4" />
								<AlertDescription>
									<strong>{t("analytics.insights.certification.title")}</strong>{" "}
									{t("analytics.insights.certification.description")}
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
