/**
 * Behavioral Analysis Component
 * Implements user behavior analysis and anomaly detection
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
import {
    Brain,
    TrendingUp,
    TrendingDown,
    Users,
    Activity,
    AlertTriangle,
    CheckCircle,
    Eye,
    Clock,
    MousePointer,
    Monitor,
    Smartphone,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface BehavioralAnalysisProps {
	className?: string;
}

interface Anomaly {
	id: string;
	type: string;
	user: string;
	confidence: number;
	severity: "low" | "medium" | "high" | "critical";
	description: string;
	timestamp: Date;
	status: "flagged" | "investigating" | "resolved";
}

interface BehaviorMetrics {
	totalUsers: number;
	activeUsers: number;
	anomaliesDetected: number;
	falsePositives: number;
	averageSessionTime: number;
	averageChallengesPerSession: number;
	peakHours: number[];
	deviceDistribution: Record<string, number>;
	behaviorPatterns: Record<string, string>;
}

export function BehavioralAnalysis({ className = "" }: BehavioralAnalysisProps) {
	const t = useTranslations("behavioral");
	const [activeTab, setActiveTab] = useState("overview");
	const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
	const [behaviorMetrics, setBehaviorMetrics] = useState<Partial<BehaviorMetrics>>({});
	const [selectedTimeframe, setSelectedTimeframe] = useState("24h");

	// Mock behavioral analysis data
	useEffect(() => {
		const mockAnomalies: Anomaly[] = [
			{
				id: "1",
				type: "unusual_login_time",
				user: "user_12345",
				confidence: 0.89,
				severity: "medium",
				description: "Login at 3:42 AM, 4 hours earlier than usual pattern",
				timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
				status: "flagged",
			},
			{
				id: "2",
				type: "rapid_actions",
				user: "user_67890",
				confidence: 0.95,
				severity: "high",
				description: "Completed 15 challenges in 30 minutes (3x faster than average)",
				timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
				status: "investigating",
			},
			{
				id: "3",
				type: "device_switch",
				user: "user_54321",
				confidence: 0.76,
				severity: "low",
				description: "Switched from desktop to mobile during active session",
				timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
				status: "resolved",
			},
			{
				id: "4",
				type: "location_change",
				user: "user_98765",
				confidence: 0.82,
				severity: "medium",
				description: "Login from Tokyo, Japan (usually logs in from New York, US)",
				timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
				status: "flagged",
			},
		];

		const mockMetrics = {
			totalUsers: 15_420,
			activeUsers: 8934,
			anomaliesDetected: 127,
			falsePositives: 18,
			averageSessionTime: 45, // minutes
			averageChallengesPerSession: 2.3,
			peakHours: [9, 10, 14, 15, 19, 20],
			deviceDistribution: {
				desktop: 68,
				mobile: 24,
				tablet: 8,
			},
			behaviorPatterns: {
				learning_pace: "normal",
				session_frequency: "regular",
				challenge_completion: "steady",
				time_spent: "average",
			},
		};

		setAnomalies(mockAnomalies);
		setBehaviorMetrics(mockMetrics);
	}, []);

	const severityConfig = {
		low: { color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
		medium: { color: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50" },
		high: { color: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
		critical: { color: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
	};

	const statusConfig = {
		flagged: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50" },
		investigating: { icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
		resolved: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
	};

	const getConfidenceColor = (confidence: number) => {
		if (confidence >= 0.8) return "text-red-600";
		if (confidence >= 0.6) return "text-orange-600";
		if (confidence >= 0.4) return "text-yellow-600";
		return "text-green-600";
	};

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center space-x-2">
						<Brain className="h-6 w-6" />
						<span>{t("behavioralAnalysis.title")}</span>
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						{t("behavioralAnalysis.subtitle")}
					</p>
				</div>
				<div className="flex items-center space-x-4">
					<Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1h">{t("timeframes.1h")}</SelectItem>
							<SelectItem value="24h">{t("timeframes.24h")}</SelectItem>
							<SelectItem value="7d">{t("timeframes.7d")}</SelectItem>
							<SelectItem value="30d">{t("timeframes.30d")}</SelectItem>
						</SelectContent>
					</Select>
					<Badge variant="outline" className="bg-green-50 text-green-700">
						<Activity className="h-3 w-3 mr-1" />
						{t("status.monitoring")}
					</Badge>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
					<TabsTrigger value="anomalies">{t("tabs.anomalies")}</TabsTrigger>
					<TabsTrigger value="patterns">{t("tabs.patterns")}</TabsTrigger>
					<TabsTrigger value="insights">{t("tabs.insights")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.activeUsers")}
										</p>
										<p className="text-2xl font-bold">
											{behaviorMetrics.activeUsers?.toLocaleString() || 0}
										</p>
									</div>
									<Users className="h-8 w-8 text-blue-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">+8.2%</span>
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
											{t("metrics.anomaliesDetected")}
										</p>
										<p className="text-2xl font-bold text-orange-600">
											{behaviorMetrics.anomaliesDetected || 0}
										</p>
									</div>
									<AlertTriangle className="h-8 w-8 text-orange-500" />
								</div>
								<div className="mt-4">
									<Progress
										value={
											((behaviorMetrics.anomaliesDetected || 0) /
												(behaviorMetrics.totalUsers || 1)) *
											100
										}
										className="h-2"
									/>
									<p className="text-xs text-gray-500 mt-1">
										{(
											((behaviorMetrics.anomaliesDetected || 0) /
												(behaviorMetrics.totalUsers || 1)) *
											100
										).toFixed(1)}
										% {t("metrics.ofUsers")}
									</p>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.avgSessionTime")}
										</p>
										<p className="text-2xl font-bold">
											{behaviorMetrics.averageSessionTime || 0}m
										</p>
									</div>
									<Clock className="h-8 w-8 text-green-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">+12%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.engagement")}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.challengesPerSession")}
										</p>
										<p className="text-2xl font-bold">
											{behaviorMetrics.averageChallengesPerSession || 0}
										</p>
									</div>
									<Activity className="h-8 w-8 text-purple-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingDown className="h-4 w-4 text-red-500 mr-1" />
									<span className="text-red-600">-3%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.adjusting")}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<AlertTriangle className="h-5 w-5" />
								<span>{t("recentAnomalies.title")}</span>
							</CardTitle>
							<CardDescription>{t("recentAnomalies.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{anomalies.slice(0, 3).map((anomaly) => {
									const StatusIcon =
										statusConfig[anomaly.status as keyof typeof statusConfig]
											?.icon || AlertTriangle;
									const severityStyle =
										severityConfig[
											anomaly.severity as keyof typeof severityConfig
										];

									return (
										<div
											key={anomaly.id}
											className="flex items-center justify-between p-4 border rounded-lg"
										>
											<div className="flex items-center space-x-4">
												<div
													className={`p-2 rounded-full ${statusConfig[anomaly.status as keyof typeof statusConfig]?.bg || "bg-gray-50"}`}
												>
													<StatusIcon
														className={`h-4 w-4 ${statusConfig[anomaly.status as keyof typeof statusConfig]?.color || "text-gray-600"}`}
													/>
												</div>
												<div>
													<div className="flex items-center space-x-2">
														<span className="font-medium">
															{anomaly.description}
														</span>
														<Badge
															className={`${severityStyle?.bg} ${severityStyle?.text} text-xs`}
														>
															{anomaly.severity}
														</Badge>
													</div>
													<div className="text-sm text-gray-500">
														{anomaly.user} •{" "}
														{anomaly.timestamp.toLocaleTimeString()}
													</div>
												</div>
											</div>
											<div className="text-right">
												<div
													className={`text-sm font-medium ${getConfidenceColor(anomaly.confidence)}`}
												>
													{(anomaly.confidence * 100).toFixed(0)}%{" "}
													{t("confidence")}
												</div>
												<Badge variant="outline" className="text-xs">
													{anomaly.status}
												</Badge>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="anomalies" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("anomalies.title")}</CardTitle>
							<CardDescription>{t("anomalies.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("anomalies.table.type")}</TableHead>
										<TableHead>{t("anomalies.table.user")}</TableHead>
										<TableHead>{t("anomalies.table.severity")}</TableHead>
										<TableHead>{t("anomalies.table.confidence")}</TableHead>
										<TableHead>{t("anomalies.table.status")}</TableHead>
										<TableHead>{t("anomalies.table.time")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{anomalies.map((anomaly) => {
										const StatusIcon =
											statusConfig[
												anomaly.status as keyof typeof statusConfig
											]?.icon || AlertTriangle;
										const severityStyle =
											severityConfig[
												anomaly.severity as keyof typeof severityConfig
											];

										return (
											<TableRow key={anomaly.id}>
												<TableCell className="font-medium">
													{anomaly.type.replace("_", " ")}
												</TableCell>
												<TableCell className="font-mono text-sm">
													{anomaly.user}
												</TableCell>
												<TableCell>
													<Badge
														className={`${severityStyle?.bg} ${severityStyle?.text} text-xs`}
													>
														{anomaly.severity}
													</Badge>
												</TableCell>
												<TableCell>
													<span
														className={`font-medium ${getConfidenceColor(anomaly.confidence)}`}
													>
														{(anomaly.confidence * 100).toFixed(0)}%
													</span>
												</TableCell>
												<TableCell>
													<div className="flex items-center space-x-2">
														<StatusIcon
															className={`h-4 w-4 ${statusConfig[anomaly.status as keyof typeof statusConfig]?.color || "text-gray-600"}`}
														/>
														<span className="text-sm">
															{anomaly.status}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-sm text-gray-500">
													{anomaly.timestamp.toLocaleString()}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="patterns" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Monitor className="h-5 w-5" />
									<span>{t("patterns.deviceDistribution")}</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{Object.entries(behaviorMetrics.deviceDistribution || {}).map(
										([device, percentage]: [string, number]) => {
											const deviceIcons = {
												desktop: Monitor,
												mobile: Smartphone,
												tablet: Monitor,
											};
											const DeviceIcon =
												deviceIcons[device as keyof typeof deviceIcons] ||
												Monitor;

											return (
												<div
													key={device}
													className="flex items-center justify-between"
												>
													<div className="flex items-center space-x-3">
														<DeviceIcon className="h-5 w-5 text-gray-500" />
														<span className="text-sm capitalize">
															{device}
														</span>
													</div>
													<div className="flex items-center space-x-2">
														<div className="w-24 bg-gray-200 rounded-full h-2">
															<div
																className="bg-blue-600 h-2 rounded-full"
																style={{ width: `${percentage}%` }}
															/>
														</div>
														<span className="text-sm font-medium w-8 text-right">
															{percentage}%
														</span>
													</div>
												</div>
											);
										}
									)}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Clock className="h-5 w-5" />
									<span>{t("patterns.peakHours")}</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-6 gap-2">
									{Array.from({ length: 24 }, (_, hour) => {
										const isPeak =
											behaviorMetrics.peakHours?.includes(hour) || false;
										return (
											<div
												key={hour}
												className={`p-2 text-center text-xs rounded ${
													isPeak
														? "bg-blue-100 text-blue-700 font-medium"
														: "bg-gray-100 text-gray-500"
												}`}
											>
												{hour}:00
											</div>
										);
									})}
								</div>
								<div className="mt-4 text-sm text-gray-600">
									{t("patterns.peakHoursDesc")}
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Brain className="h-5 w-5" />
								<span>{t("patterns.behaviorPatterns")}</span>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{Object.entries(behaviorMetrics.behaviorPatterns || {}).map(
									([pattern, status]: [string, string]) => (
										<div key={pattern} className="p-4 border rounded-lg">
											<div className="flex items-center justify-between mb-2">
												<span className="text-sm font-medium capitalize">
													{pattern.replace("_", " ")}
												</span>
												<Badge
													variant="outline"
													className={
														status === "normal" ||
														status === "regular" ||
														status === "steady" ||
														status === "average"
															? "text-green-600 border-green-200"
															: "text-yellow-600 border-yellow-200"
													}
												>
													{status}
												</Badge>
											</div>
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div
													className={`h-2 rounded-full ${
														status === "normal" ||
														status === "regular" ||
														status === "steady" ||
														status === "average"
															? "bg-green-500"
															: "bg-yellow-500"
													}`}
													style={{
														width:
															status === "normal" ||
															status === "regular" ||
															status === "steady" ||
															status === "average"
																? "75%"
																: "45%",
													}}
												/>
											</div>
										</div>
									)
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="insights" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("insights.actionable.title")}</CardTitle>
								<CardDescription>
									{t("insights.actionable.description")}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<Alert>
									<TrendingUp className="h-4 w-4" />
									<AlertDescription>
										<strong>{t("insights.engagement.title")}</strong>{" "}
										{t("insights.engagement.description")}
									</AlertDescription>
								</Alert>

								<Alert>
									<MousePointer className="h-4 w-4" />
									<AlertDescription>
										<strong>{t("insights.mobile.title")}</strong>{" "}
										{t("insights.mobile.description")}
									</AlertDescription>
								</Alert>

								<Alert>
									<Clock className="h-4 w-4" />
									<AlertDescription>
										<strong>{t("insights.timing.title")}</strong>{" "}
										{t("insights.timing.description")}
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
												{t("insights.recommendations.mobile.title")}
											</strong>{" "}
											{t("insights.recommendations.mobile.description")}
										</div>
									</div>

									<div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
										<div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
										<div className="text-sm">
											<strong>
												{t("insights.recommendations.content.title")}
											</strong>{" "}
											{t("insights.recommendations.content.description")}
										</div>
									</div>

									<div className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
										<div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
										<div className="text-sm">
											<strong>
												{t("insights.recommendations.notifications.title")}
											</strong>{" "}
											{t(
												"insights.recommendations.notifications.description"
											)}
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
