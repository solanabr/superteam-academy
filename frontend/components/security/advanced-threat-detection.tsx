/**
 * Advanced Threat Detection Component
 * Implements real-time security monitoring and threat detection
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
	Shield,
	AlertTriangle,
	CheckCircle,
	Activity,
	Eye,
	Zap,
	TrendingUp,
	Clock,
	Target,
	BarChart3,
} from "lucide-react";
import { useTranslations } from "next-intl";

type ThreatSeverity = "critical" | "high" | "medium" | "low";
type ThreatStatus = "blocked" | "investigating" | "mitigated" | "active";

interface Threat {
	id: string;
	type: string;
	severity: ThreatSeverity;
	source: string;
	target: string;
	timestamp: Date;
	status: ThreatStatus;
	description: string;
}

interface ThreatMetrics {
	totalThreats: number;
	blockedThreats: number;
	activeThreats: number;
	falsePositives: number;
	responseTime: number;
	uptime: number;
	threatsByType: Record<string, number>;
	threatsBySeverity: Record<string, number>;
}

interface ThreatDetectionProps {
	className?: string;
}

export function ThreatDetection({ className = "" }: ThreatDetectionProps) {
	const t = useTranslations("security");
	const [activeTab, setActiveTab] = useState("overview");
	const [threats, setThreats] = useState<Threat[]>([]);
	const [metrics, setMetrics] = useState<Partial<ThreatMetrics>>({});

	// Mock threat detection data
	useEffect(() => {
		// Simulate real-time threat monitoring
		const interval = setInterval(() => {
			const mockThreats: Threat[] = [
				{
					id: "1",
					type: "brute_force",
					severity: "high",
					source: "192.168.1.100",
					target: "/api/auth/login",
					timestamp: new Date(Date.now() - 5 * 60 * 1000),
					status: "blocked",
					description: "Multiple failed login attempts detected",
				},
				{
					id: "2",
					type: "suspicious_activity",
					severity: "medium",
					source: "10.0.0.50",
					target: "/api/courses",
					timestamp: new Date(Date.now() - 15 * 60 * 1000),
					status: "investigating",
					description: "Unusual API call patterns detected",
				},
				{
					id: "3",
					type: "sql_injection",
					severity: "critical",
					source: "203.0.113.1",
					target: "/api/search",
					timestamp: new Date(Date.now() - 30 * 60 * 1000),
					status: "mitigated",
					description: "SQL injection attempt blocked",
				},
			];

			const mockMetrics = {
				totalThreats: 47,
				blockedThreats: 42,
				activeThreats: 3,
				falsePositives: 2,
				responseTime: 1.2, // seconds
				uptime: 99.98,
				threatsByType: {
					brute_force: 15,
					suspicious_activity: 12,
					sql_injection: 8,
					xss_attempt: 6,
					ddos_attempt: 4,
					malware_scan: 2,
				},
				threatsBySeverity: {
					critical: 5,
					high: 12,
					medium: 20,
					low: 10,
				},
			};

			setThreats(mockThreats);
			setMetrics(mockMetrics);
		}, 5000);

		return () => clearInterval(interval);
	}, []);

	const severityConfig = {
		critical: { color: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
		high: { color: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
		medium: { color: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50" },
		low: { color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
	};

	const statusConfig = {
		blocked: { icon: Shield, color: "text-green-600", bg: "bg-green-50" },
		investigating: { icon: Eye, color: "text-yellow-600", bg: "bg-yellow-50" },
		mitigated: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50" },
		active: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
	};

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center space-x-2">
						<Shield className="h-6 w-6" />
						<span>{t("threatDetection.title")}</span>
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						{t("threatDetection.subtitle")}
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Badge variant="outline" className="bg-green-50 text-green-700">
						<Activity className="h-3 w-3 mr-1" />
						{t("status.active")}
					</Badge>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
					<TabsTrigger value="threats">{t("tabs.threats")}</TabsTrigger>
					<TabsTrigger value="analytics">{t("tabs.analytics")}</TabsTrigger>
					<TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.totalThreats")}
										</p>
										<p className="text-2xl font-bold">
											{metrics.totalThreats || 0}
										</p>
									</div>
									<Shield className="h-8 w-8 text-red-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">+12%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.fromLastWeek")}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.blockedThreats")}
										</p>
										<p className="text-2xl font-bold text-green-600">
											{metrics.blockedThreats || 0}
										</p>
									</div>
									<CheckCircle className="h-8 w-8 text-green-500" />
								</div>
								<div className="mt-4">
									<Progress
										value={
											((metrics.blockedThreats || 0) /
												(metrics.totalThreats || 1)) *
											100
										}
										className="h-2"
									/>
									<p className="text-xs text-gray-500 mt-1">
										{Math.round(
											((metrics.blockedThreats || 0) /
												(metrics.totalThreats || 1)) *
												100
										)}
										% {t("metrics.blockRate")}
									</p>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.responseTime")}
										</p>
										<p className="text-2xl font-bold">
											{metrics.responseTime || 0}s
										</p>
									</div>
									<Zap className="h-8 w-8 text-blue-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<Clock className="h-4 w-4 text-blue-500 mr-1" />
									<span className="text-blue-600">{t("metrics.average")}</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.uptime")}
										</p>
										<p className="text-2xl font-bold text-green-600">
											{metrics.uptime || 0}%
										</p>
									</div>
									<Activity className="h-8 w-8 text-green-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<CheckCircle className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">{t("metrics.excellent")}</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<AlertTriangle className="h-5 w-5" />
								<span>{t("recentThreats.title")}</span>
							</CardTitle>
							<CardDescription>{t("recentThreats.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{threats.slice(0, 5).map((threat) => {
									const statusStyle = statusConfig[threat.status];
									const StatusIcon = statusStyle?.icon || AlertTriangle;
									const severityStyle = severityConfig[threat.severity];

									return (
										<div
											key={threat.id}
											className="flex items-center justify-between p-4 border rounded-lg"
										>
											<div className="flex items-center space-x-4">
												<div
													className={`p-2 rounded-full ${statusStyle?.bg || "bg-gray-50"}`}
												>
													<StatusIcon
														className={`h-4 w-4 ${statusStyle?.color || "text-gray-600"}`}
													/>
												</div>
												<div>
													<div className="flex items-center space-x-2">
														<span className="font-medium">
															{threat.description}
														</span>
														<Badge
															className={`${severityStyle?.bg} ${severityStyle?.text} text-xs`}
														>
															{threat.severity}
														</Badge>
													</div>
													<div className="text-sm text-gray-500">
														{threat.source} → {threat.target}
													</div>
												</div>
											</div>
											<div className="text-right">
												<div className="text-sm text-gray-500">
													{threat.timestamp.toLocaleTimeString()}
												</div>
												<Badge variant="outline" className="text-xs">
													{threat.status}
												</Badge>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="threats" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("threats.title")}</CardTitle>
							<CardDescription>{t("threats.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("threats.table.type")}</TableHead>
										<TableHead>{t("threats.table.severity")}</TableHead>
										<TableHead>{t("threats.table.source")}</TableHead>
										<TableHead>{t("threats.table.target")}</TableHead>
										<TableHead>{t("threats.table.status")}</TableHead>
										<TableHead>{t("threats.table.time")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{threats.map((threat) => {
										const statusStyle = statusConfig[threat.status];
										const StatusIcon = statusStyle?.icon || AlertTriangle;
										const severityStyle = severityConfig[threat.severity];

										return (
											<TableRow key={threat.id}>
												<TableCell className="font-medium">
													{threat.type.replace("_", " ")}
												</TableCell>
												<TableCell>
													<Badge
														className={`${severityStyle?.bg} ${severityStyle?.text} text-xs`}
													>
														{threat.severity}
													</Badge>
												</TableCell>
												<TableCell className="font-mono text-sm">
													{threat.source}
												</TableCell>
												<TableCell className="font-mono text-sm">
													{threat.target}
												</TableCell>
												<TableCell>
													<div className="flex items-center space-x-2">
														<StatusIcon
															className={`h-4 w-4 ${statusStyle?.color || "text-gray-600"}`}
														/>
														<span className="text-sm">
															{threat.status}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-sm text-gray-500">
													{threat.timestamp.toLocaleString()}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="analytics" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<BarChart3 className="h-5 w-5" />
									<span>{t("analytics.threatsByType")}</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{Object.entries(metrics.threatsByType ?? {}).map(
										([type, count]) => {
											const maxVal = Math.max(
												...Object.values(metrics.threatsByType ?? {}),
												1
											);
											return (
												<div
													key={type}
													className="flex items-center justify-between"
												>
													<span className="text-sm capitalize">
														{type.replace("_", " ")}
													</span>
													<div className="flex items-center space-x-2">
														<div className="w-24 bg-gray-200 rounded-full h-2">
															<div
																className="bg-blue-600 h-2 rounded-full"
																style={{
																	width: `${(count / maxVal) * 100}%`,
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

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Target className="h-5 w-5" />
									<span>{t("analytics.threatsBySeverity")}</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{Object.entries(metrics.threatsBySeverity ?? {}).map(
										([severity, count]) => {
											const style =
												severityConfig[
													severity as keyof typeof severityConfig
												];
											const maxVal = Math.max(
												...Object.values(metrics.threatsBySeverity ?? {}),
												1
											);
											return (
												<div
													key={severity}
													className="flex items-center justify-between"
												>
													<div className="flex items-center space-x-2">
														<div
															className={`w-3 h-3 rounded-full ${style?.color}`}
														/>
														<span className="text-sm capitalize">
															{severity}
														</span>
													</div>
													<div className="flex items-center space-x-2">
														<div className="w-24 bg-gray-200 rounded-full h-2">
															<div
																className={`h-2 rounded-full ${style?.color}`}
																style={{
																	width: `${(count / maxVal) * 100}%`,
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
				</TabsContent>

				<TabsContent value="settings" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("settings.title")}</CardTitle>
							<CardDescription>{t("settings.description")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
									<h4 className="font-medium">{t("settings.detectionRules")}</h4>
									<div className="space-y-2">
										<label className="flex items-center space-x-2">
											<input
												type="checkbox"
												defaultChecked={true}
												className="rounded"
											/>
											<span className="text-sm">
												{t("settings.bruteForce")}
											</span>
										</label>
										<label className="flex items-center space-x-2">
											<input
												type="checkbox"
												defaultChecked={true}
												className="rounded"
											/>
											<span className="text-sm">
												{t("settings.sqlInjection")}
											</span>
										</label>
										<label className="flex items-center space-x-2">
											<input
												type="checkbox"
												defaultChecked={true}
												className="rounded"
											/>
											<span className="text-sm">{t("settings.xss")}</span>
										</label>
										<label className="flex items-center space-x-2">
											<input
												type="checkbox"
												defaultChecked={true}
												className="rounded"
											/>
											<span className="text-sm">{t("settings.ddos")}</span>
										</label>
									</div>
								</div>

								<div className="space-y-4">
									<h4 className="font-medium">{t("settings.alertSettings")}</h4>
									<div className="space-y-2">
										<label className="flex items-center space-x-2">
											<input
												type="checkbox"
												defaultChecked={true}
												className="rounded"
											/>
											<span className="text-sm">
												{t("settings.emailAlerts")}
											</span>
										</label>
										<label className="flex items-center space-x-2">
											<input
												type="checkbox"
												defaultChecked={true}
												className="rounded"
											/>
											<span className="text-sm">
												{t("settings.smsAlerts")}
											</span>
										</label>
										<label className="flex items-center space-x-2">
											<input type="checkbox" className="rounded" />
											<span className="text-sm">
												{t("settings.slackAlerts")}
											</span>
										</label>
									</div>
								</div>
							</div>

							<div className="pt-6 border-t">
								<Button>
									<Shield className="h-4 w-4 mr-2" />
									{t("settings.saveChanges")}
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
