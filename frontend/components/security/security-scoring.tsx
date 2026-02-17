/**
 * Security Scoring Component
 * Implements dynamic security scoring and risk assessment
 */

"use client";

import { useState, useEffect } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Shield,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Star,
    StarHalf,
    Award,
    Target,
    Users,
    Activity,
    Eye,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface UserScore {
	id: string;
	name: string;
	avatar: string;
	email: string;
	score: number;
	grade: string;
	riskLevel: string;
	factors: Record<string, number>;
	lastActivity: Date;
	status: string;
}

interface ScoringTrends {
	averageScore: string;
	highRisk: string;
	incidents: string;
}

interface ScoringMetrics {
	averageScore: number;
	totalUsers: number;
	highRiskUsers: number;
	mediumRiskUsers: number;
	lowRiskUsers: number;
	scoreDistribution: Record<string, number>;
	riskFactors: Record<string, number>;
	trends: ScoringTrends;
}

const DEFAULT_METRICS: ScoringMetrics = {
	averageScore: 0,
	totalUsers: 0,
	highRiskUsers: 0,
	mediumRiskUsers: 0,
	lowRiskUsers: 0,
	scoreDistribution: {},
	riskFactors: {},
	trends: { averageScore: "+0%", highRisk: "+0%", incidents: "+0%" },
};

interface SecurityScoringProps {
	className?: string;
}

export function SecurityScoring({ className = "" }: SecurityScoringProps) {
	const t = useTranslations("securityScoring");
	const [activeTab, setActiveTab] = useState("overview");
	const [userScores, setUserScores] = useState<UserScore[]>([]);
	const [scoringMetrics, setScoringMetrics] = useState<ScoringMetrics>(DEFAULT_METRICS);
	const [selectedTimeframe, setSelectedTimeframe] = useState("7d");

	// Mock security scoring data
	useEffect(() => {
		const mockUsers = [
			{
				id: "1",
				name: "Alice Johnson",
				avatar: "/avatars/alice.jpg",
				email: "alice@example.com",
				score: 95,
				grade: "A+",
				riskLevel: "low",
				factors: {
					authentication: 98,
					behavior: 92,
					device: 96,
					location: 94,
				},
				lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
				status: "active",
			},
			{
				id: "2",
				name: "Bob Smith",
				avatar: "/avatars/bob.jpg",
				email: "bob@example.com",
				score: 78,
				grade: "B",
				riskLevel: "medium",
				factors: {
					authentication: 85,
					behavior: 75,
					device: 80,
					location: 72,
				},
				lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
				status: "active",
			},
			{
				id: "3",
				name: "Charlie Brown",
				avatar: "/avatars/charlie.jpg",
				email: "charlie@example.com",
				score: 45,
				grade: "F",
				riskLevel: "high",
				factors: {
					authentication: 60,
					behavior: 35,
					device: 50,
					location: 40,
				},
				lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
				status: "suspended",
			},
			{
				id: "4",
				name: "Diana Prince",
				avatar: "/avatars/diana.jpg",
				email: "diana@example.com",
				score: 88,
				grade: "A-",
				riskLevel: "low",
				factors: {
					authentication: 92,
					behavior: 85,
					device: 88,
					location: 86,
				},
				lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
				status: "active",
			},
			{
				id: "5",
				name: "Eve Wilson",
				avatar: "/avatars/eve.jpg",
				email: "eve@example.com",
				score: 62,
				grade: "C",
				riskLevel: "medium",
				factors: {
					authentication: 70,
					behavior: 58,
					device: 65,
					location: 55,
				},
				lastActivity: new Date(Date.now() - 12 * 60 * 60 * 1000),
				status: "active",
			},
		];

		const mockMetrics = {
			averageScore: 73.6,
			totalUsers: 15_420,
			highRiskUsers: 234,
			mediumRiskUsers: 1247,
			lowRiskUsers: 13_939,
			scoreDistribution: {
				"A+": 2456,
				A: 3892,
				"A-": 4231,
				"B+": 2876,
				B: 1987,
				"B-": 1456,
				"C+": 987,
				C: 654,
				"C-": 432,
				F: 234,
			},
			riskFactors: {
				authentication: 84.2,
				behavior: 76.8,
				device: 81.5,
				location: 79.3,
			},
			trends: {
				averageScore: "+2.3%",
				highRisk: "-5.1%",
				incidents: "-12.7%",
			},
		};

		setUserScores(mockUsers);
		setScoringMetrics(mockMetrics);
	}, []);

	const getScoreColor = (score: number) => {
		if (score >= 90) return "text-green-600";
		if (score >= 80) return "text-blue-600";
		if (score >= 70) return "text-yellow-600";
		if (score >= 60) return "text-orange-600";
		return "text-red-600";
	};

	const getGradeColor = (grade: string) => {
		if (grade.startsWith("A")) return "bg-green-100 text-green-800";
		if (grade.startsWith("B")) return "bg-blue-100 text-blue-800";
		if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-800";
		return "bg-red-100 text-red-800";
	};

	const getRiskColor = (risk: string) => {
		const colors = {
			low: "bg-green-100 text-green-800",
			medium: "bg-yellow-100 text-yellow-800",
			high: "bg-red-100 text-red-800",
			critical: "bg-purple-100 text-purple-800",
		};
		return colors[risk as keyof typeof colors] || "bg-gray-100 text-gray-800";
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "active":
				return <CheckCircle className="h-4 w-4 text-green-600" />;
			case "suspended":
				return <XCircle className="h-4 w-4 text-red-600" />;
			case "pending":
				return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
			default:
				return <Activity className="h-4 w-4 text-gray-600" />;
		}
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
						<Shield className="h-6 w-6" />
						<span>{t("securityScoring.title")}</span>
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						{t("securityScoring.subtitle")}
					</p>
				</div>
				<div className="flex items-center space-x-4">
					<Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="24h">{t("timeframes.24h")}</SelectItem>
							<SelectItem value="7d">{t("timeframes.7d")}</SelectItem>
							<SelectItem value="30d">{t("timeframes.30d")}</SelectItem>
							<SelectItem value="90d">{t("timeframes.90d")}</SelectItem>
						</SelectContent>
					</Select>
					<Badge variant="outline" className="bg-green-50 text-green-700">
						<Activity className="h-3 w-3 mr-1" />
						{t("status.updating")}
					</Badge>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
					<TabsTrigger value="users">{t("tabs.users")}</TabsTrigger>
					<TabsTrigger value="factors">{t("tabs.factors")}</TabsTrigger>
					<TabsTrigger value="insights">{t("tabs.insights")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.averageScore")}
										</p>
										<p className="text-2xl font-bold">
											{scoringMetrics.averageScore?.toFixed(1) || 0}
										</p>
									</div>
									<Award className="h-8 w-8 text-yellow-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">
										{scoringMetrics.trends?.averageScore || "+0%"}
									</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.vsLastPeriod")}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.highRiskUsers")}
										</p>
										<p className="text-2xl font-bold text-red-600">
											{scoringMetrics.highRiskUsers || 0}
										</p>
									</div>
									<AlertTriangle className="h-8 w-8 text-red-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingDown className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">
										{scoringMetrics.trends?.highRisk || "+0%"}
									</span>
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
											{t("metrics.totalUsers")}
										</p>
										<p className="text-2xl font-bold">
											{(scoringMetrics.totalUsers || 0).toLocaleString()}
										</p>
									</div>
									<Users className="h-8 w-8 text-blue-500" />
								</div>
								<div className="mt-4">
									<Progress
										value={
											((scoringMetrics.lowRiskUsers || 0) /
												(scoringMetrics.totalUsers || 1)) *
											100
										}
										className="h-2"
									/>
									<p className="text-xs text-gray-500 mt-1">
										{(
											((scoringMetrics.lowRiskUsers || 0) /
												(scoringMetrics.totalUsers || 1)) *
											100
										).toFixed(1)}
										% {t("metrics.lowRisk")}
									</p>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.securityIncidents")}
										</p>
										<p className="text-2xl font-bold text-orange-600">23</p>
									</div>
									<Target className="h-8 w-8 text-orange-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingDown className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">
										{scoringMetrics.trends?.incidents || "+0%"}
									</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.reduction")}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("scoreDistribution.title")}</CardTitle>
							<CardDescription>{t("scoreDistribution.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
								{Object.entries(scoringMetrics.scoreDistribution || {}).map(
									([grade, count]) => (
										<div
											key={grade}
											className="text-center p-4 border rounded-lg"
										>
											<div
												className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${getGradeColor(grade)}`}
											>
												<span className="text-lg font-bold">{grade}</span>
											</div>
											<div className="text-2xl font-bold">{count}</div>
											<div className="text-sm text-gray-500">
												{(
													(count / (scoringMetrics.totalUsers || 1)) *
													100
												).toFixed(1)}
												%
											</div>
										</div>
									)
								)}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{t("riskOverview.title")}</CardTitle>
							<CardDescription>{t("riskOverview.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="text-center">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
										<CheckCircle className="h-8 w-8 text-green-600" />
									</div>
									<div className="text-2xl font-bold text-green-600">
										{scoringMetrics.lowRiskUsers || 0}
									</div>
									<div className="text-sm text-gray-600">
										{t("riskOverview.lowRisk")}
									</div>
									<div className="text-xs text-gray-500 mt-1">
										{(
											((scoringMetrics.lowRiskUsers || 0) /
												(scoringMetrics.totalUsers || 1)) *
											100
										).toFixed(1)}
										%
									</div>
								</div>

								<div className="text-center">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
										<AlertTriangle className="h-8 w-8 text-yellow-600" />
									</div>
									<div className="text-2xl font-bold text-yellow-600">
										{scoringMetrics.mediumRiskUsers || 0}
									</div>
									<div className="text-sm text-gray-600">
										{t("riskOverview.mediumRisk")}
									</div>
									<div className="text-xs text-gray-500 mt-1">
										{(
											((scoringMetrics.mediumRiskUsers || 0) /
												(scoringMetrics.totalUsers || 1)) *
											100
										).toFixed(1)}
										%
									</div>
								</div>

								<div className="text-center">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
										<XCircle className="h-8 w-8 text-red-600" />
									</div>
									<div className="text-2xl font-bold text-red-600">
										{scoringMetrics.highRiskUsers || 0}
									</div>
									<div className="text-sm text-gray-600">
										{t("riskOverview.highRisk")}
									</div>
									<div className="text-xs text-gray-500 mt-1">
										{(
											((scoringMetrics.highRiskUsers || 0) /
												(scoringMetrics.totalUsers || 1)) *
											100
										).toFixed(1)}
										%
									</div>
								</div>
							</div>
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
										<TableHead>{t("users.table.score")}</TableHead>
										<TableHead>{t("users.table.grade")}</TableHead>
										<TableHead>{t("users.table.risk")}</TableHead>
										<TableHead>{t("users.table.lastActivity")}</TableHead>
										<TableHead>{t("users.table.status")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{userScores.map((user) => (
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
														className={`text-lg font-bold ${getScoreColor(user.score)}`}
													>
														{user.score}
													</span>
													<div className="flex">
														{renderStars(user.score)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Badge className={getGradeColor(user.grade)}>
													{user.grade}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge className={getRiskColor(user.riskLevel)}>
													{user.riskLevel}
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-gray-500">
												{user.lastActivity.toLocaleString()}
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													{getStatusIcon(user.status)}
													<span className="text-sm capitalize">
														{user.status}
													</span>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="factors" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("factors.overview.title")}</CardTitle>
								<CardDescription>
									{t("factors.overview.description")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{Object.entries(scoringMetrics.riskFactors || {}).map(
										([factor, score]) => (
											<div
												key={factor}
												className="flex items-center justify-between"
											>
												<span className="text-sm font-medium capitalize">
													{factor}
												</span>
												<div className="flex items-center space-x-2">
													<div className="w-32 bg-gray-200 rounded-full h-2">
														<div
															className="bg-blue-600 h-2 rounded-full"
															style={{ width: `${score}%` }}
														/>
													</div>
													<span
														className={`text-sm font-medium ${getScoreColor(score)}`}
													>
														{score}%
													</span>
												</div>
											</div>
										)
									)}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{t("factors.breakdown.title")}</CardTitle>
								<CardDescription>
									{t("factors.breakdown.description")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{userScores.slice(0, 3).map((user) => (
										<div key={user.id} className="p-4 border rounded-lg">
											<div className="flex items-center justify-between mb-3">
												<span className="font-medium">{user.name}</span>
												<Badge className={getGradeColor(user.grade)}>
													{user.grade}
												</Badge>
											</div>
											<div className="space-y-2">
												{Object.entries(user.factors).map(
													([factor, score]) => (
														<div
															key={factor}
															className="flex items-center justify-between text-sm"
														>
															<span className="capitalize">
																{factor}
															</span>
															<span
																className={`font-medium ${getScoreColor(score)}`}
															>
																{score}%
															</span>
														</div>
													)
												)}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="insights" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("insights.security.title")}</CardTitle>
								<CardDescription>
									{t("insights.security.description")}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<Alert>
									<TrendingUp className="h-4 w-4" />
									<AlertDescription>
										<strong>{t("insights.security.improvement.title")}</strong>{" "}
										{t("insights.security.improvement.description")}
									</AlertDescription>
								</Alert>

								<Alert>
									<Shield className="h-4 w-4" />
									<AlertDescription>
										<strong>
											{t("insights.security.authentication.title")}
										</strong>{" "}
										{t("insights.security.authentication.description")}
									</AlertDescription>
								</Alert>

								<Alert>
									<Eye className="h-4 w-4" />
									<AlertDescription>
										<strong>{t("insights.security.monitoring.title")}</strong>{" "}
										{t("insights.security.monitoring.description")}
									</AlertDescription>
								</Alert>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{t("insights.recommendations.title")}</CardTitle>
								<CardDescription>
									{t("insights.recommendations.description")}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
										<div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
										<div className="text-sm">
											<strong>
												{t("insights.recommendations.training.title")}
											</strong>{" "}
											{t("insights.recommendations.training.description")}
										</div>
									</div>

									<div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
										<div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
										<div className="text-sm">
											<strong>
												{t("insights.recommendations.mfa.title")}
											</strong>{" "}
											{t("insights.recommendations.mfa.description")}
										</div>
									</div>

									<div className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
										<div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
										<div className="text-sm">
											<strong>
												{t("insights.recommendations.monitoring.title")}
											</strong>{" "}
											{t("insights.recommendations.monitoring.description")}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
