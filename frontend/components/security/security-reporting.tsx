/**
 * Security Reporting Component
 * Implements comprehensive security reporting and analytics dashboard
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
	FileText,
	Download,
	Calendar,
	TrendingUp,
	TrendingDown,
	BarChart3,
	Shield,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Clock,
	Activity,
	Eye,
	Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ReportKeyMetrics {
	[key: string]: number;
}

interface SecurityReport {
	id: string;
	title: string;
	type: string;
	status: string;
	generatedAt: Date;
	generatedBy: string;
	period: string;
	format: string;
	size: string;
	recipients: string[];
	keyMetrics: ReportKeyMetrics;
}

interface TrendPoint {
	date: string;
	count?: number;
	time?: number;
	level?: number;
}

interface AnalyticsOverview {
	totalIncidents: number;
	resolvedIncidents: number;
	avgResolutionTime: number;
	slaCompliance: number;
	activeThreats: number;
	blockedAttacks: number;
	userTrainingCompletion: number;
	systemUptime: number;
}

interface IncidentBreakdowns {
	incidentTypes: Record<string, number>;
	severityLevels: Record<string, number>;
	departments: Record<string, number>;
}

interface ComplianceFramework {
	score: number;
	lastAudit: Date;
	nextAudit: Date;
	findings: number;
	status: string;
}

interface AnalyticsData {
	overview: AnalyticsOverview;
	trends: {
		incidents: TrendPoint[];
		responseTime: TrendPoint[];
		threatLevel: TrendPoint[];
	};
	breakdowns: IncidentBreakdowns;
	compliance: Record<string, ComplianceFramework>;
	performance: {
		detectionAccuracy: number;
		falsePositiveRate: number;
		meanTimeToDetect: number;
		meanTimeToRespond: number;
		meanTimeToResolve: number;
		automationCoverage: number;
	};
}

interface DateRange {
	from: Date;
	to: Date;
}

interface SecurityReportingProps {
	className?: string;
}

export function SecurityReporting({ className = "" }: SecurityReportingProps) {
	const t = useTranslations("securityReporting");
	const [activeTab, setActiveTab] = useState("overview");
	const [dateRange, setDateRange] = useState<DateRange>({
		from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
		to: new Date(),
	});
	const [reportType, setReportType] = useState("executive");
	const [reports, setReports] = useState<SecurityReport[]>([]);
	const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

	// Mock report data
	useEffect(() => {
		const mockReports = [
			{
				id: "RPT-2024-001",
				title: "Monthly Security Executive Summary",
				type: "executive",
				status: "completed",
				generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
				generatedBy: "Security Operations Center",
				period: "January 2024",
				format: "PDF",
				size: "2.4 MB",
				recipients: ["CEO", "CTO", "CISO"],
				keyMetrics: {
					incidents: 12,
					resolved: 11,
					avgResponseTime: 45,
					slaCompliance: 0.92,
				},
			},
			{
				id: "RPT-2024-002",
				title: "Threat Intelligence Report",
				type: "threat",
				status: "completed",
				generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
				generatedBy: "Threat Intelligence Team",
				period: "Weekly",
				format: "PDF",
				size: "1.8 MB",
				recipients: ["Security Team", "IT Operations"],
				keyMetrics: {
					newThreats: 23,
					blockedAttacks: 156,
					vulnerabilityPatches: 8,
					riskScore: 7.2,
				},
			},
			{
				id: "RPT-2024-003",
				title: "Compliance Audit Report",
				type: "compliance",
				status: "in_progress",
				generatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
				generatedBy: "Compliance Team",
				period: "Q1 2024",
				format: "PDF",
				size: "3.1 MB",
				recipients: ["Legal", "Compliance Officer", "Board"],
				keyMetrics: {
					gdprCompliance: 0.98,
					ccpaCompliance: 0.95,
					soxCompliance: 0.97,
					overallScore: 0.97,
				},
			},
		];

		const mockAnalytics = {
			overview: {
				totalIncidents: 156,
				resolvedIncidents: 148,
				avgResolutionTime: 4.2, // hours
				slaCompliance: 0.89,
				activeThreats: 12,
				blockedAttacks: 2847,
				userTrainingCompletion: 0.76,
				systemUptime: 0.997,
			},
			trends: {
				incidents: [
					{ date: "2024-01-01", count: 8 },
					{ date: "2024-01-08", count: 12 },
					{ date: "2024-01-15", count: 6 },
					{ date: "2024-01-22", count: 9 },
					{ date: "2024-01-29", count: 7 },
				],
				responseTime: [
					{ date: "2024-01-01", time: 67 },
					{ date: "2024-01-08", time: 58 },
					{ date: "2024-01-15", time: 72 },
					{ date: "2024-01-22", time: 45 },
					{ date: "2024-01-29", time: 52 },
				],
				threatLevel: [
					{ date: "2024-01-01", level: 3 },
					{ date: "2024-01-08", level: 4 },
					{ date: "2024-01-15", level: 2 },
					{ date: "2024-01-22", level: 5 },
					{ date: "2024-01-29", level: 3 },
				],
			},
			breakdowns: {
				incidentTypes: {
					authentication: 45,
					data_breach: 23,
					phishing: 34,
					malware: 18,
					ddos: 12,
					other: 24,
				},
				severityLevels: {
					critical: 12,
					high: 45,
					medium: 67,
					low: 32,
				},
				departments: {
					engineering: 34,
					marketing: 23,
					sales: 18,
					hr: 12,
					finance: 15,
					other: 54,
				},
			},
			compliance: {
				gdpr: {
					score: 0.96,
					lastAudit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
					nextAudit: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
					findings: 3,
					status: "compliant",
				},
				ccpa: {
					score: 0.94,
					lastAudit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
					nextAudit: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
					findings: 5,
					status: "compliant",
				},
				sox: {
					score: 0.98,
					lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
					nextAudit: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
					findings: 1,
					status: "compliant",
				},
			},
			performance: {
				detectionAccuracy: 0.94,
				falsePositiveRate: 0.06,
				meanTimeToDetect: 12, // minutes
				meanTimeToRespond: 45, // minutes
				meanTimeToResolve: 4.2, // hours
				automationCoverage: 0.73,
			},
		};

		setReports(mockReports);
		setAnalytics(mockAnalytics);
	}, []);

	const reportTypes = {
		executive: { label: t("reportTypes.executive"), icon: BarChart3 },
		threat: { label: t("reportTypes.threat"), icon: Shield },
		compliance: { label: t("reportTypes.compliance"), icon: CheckCircle },
		incident: { label: t("reportTypes.incident"), icon: AlertTriangle },
		audit: { label: t("reportTypes.audit"), icon: FileText },
	};

	const statusConfig = {
		completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
		in_progress: { color: "bg-blue-100 text-blue-800", icon: Activity },
		failed: { color: "bg-red-100 text-red-800", icon: XCircle },
		scheduled: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
	};

	const complianceStatusConfig = {
		compliant: { color: "bg-green-100 text-green-800", icon: CheckCircle },
		warning: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
		non_compliant: { color: "bg-red-100 text-red-800", icon: XCircle },
	};

	const generateReport = () => {
		// ignored
	};

	const exportReport = (_reportId: string, _format: string) => {
		// ignored
	};

	const scheduleReport = () => {
		// ignored
	};

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center space-x-2">
						<FileText className="h-6 w-6" />
						<span>{t("securityReporting.title")}</span>
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						{t("securityReporting.subtitle")}
					</p>
				</div>
				<div className="flex items-center space-x-4">
					<Button variant="outline" size="sm" onClick={() => setActiveTab("create")}>
						<FileText className="h-4 w-4 mr-2" />
						{t("createReport")}
					</Button>
					<Button variant="outline" size="sm">
						<Settings className="h-4 w-4 mr-2" />
						{t("settings")}
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
					<TabsTrigger value="reports">{t("tabs.reports")}</TabsTrigger>
					<TabsTrigger value="analytics">{t("tabs.analytics")}</TabsTrigger>
					<TabsTrigger value="compliance">{t("tabs.compliance")}</TabsTrigger>
					<TabsTrigger value="create">{t("tabs.create")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.totalIncidents")}
										</p>
										<p className="text-2xl font-bold">
											{analytics?.overview?.totalIncidents ?? 0}
										</p>
									</div>
									<AlertTriangle className="h-8 w-8 text-red-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingDown className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">-12%</span>
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
											{t("metrics.slaCompliance")}
										</p>
										<p className="text-2xl font-bold text-green-600">
											{(
												(analytics?.overview?.slaCompliance ?? 0) * 100
											).toFixed(1)}
											%
										</p>
									</div>
									<CheckCircle className="h-8 w-8 text-green-500" />
								</div>
								<div className="mt-4">
									<Progress
										value={(analytics?.overview?.slaCompliance ?? 0) * 100}
										className="h-2"
									/>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.blockedAttacks")}
										</p>
										<p className="text-2xl font-bold text-blue-600">
											{analytics?.overview?.blockedAttacks ?? 0}
										</p>
									</div>
									<Shield className="h-8 w-8 text-blue-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">+23%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.effectiveness")}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.systemUptime")}
										</p>
										<p className="text-2xl font-bold text-purple-600">
											{(
												(analytics?.overview?.systemUptime ?? 0) * 100
											).toFixed(2)}
											%
										</p>
									</div>
									<Activity className="h-8 w-8 text-purple-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">+0.1%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.reliability")}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("overview.recentReports.title")}</CardTitle>
							<CardDescription>
								{t("overview.recentReports.description")}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{reports.slice(0, 3).map((report) => {
									const StatusIcon =
										statusConfig[report.status as keyof typeof statusConfig]
											?.icon || Activity;
									const TypeIcon =
										reportTypes[report.type as keyof typeof reportTypes]
											?.icon || FileText;

									return (
										<div
											key={report.id}
											className="flex items-center justify-between p-4 border rounded-lg"
										>
											<div className="flex items-center space-x-4">
												<div className="p-2 bg-blue-100 rounded-lg">
													<TypeIcon className="h-5 w-5 text-blue-600" />
												</div>
												<div>
													<div className="font-medium">
														{report.title}
													</div>
													<div className="text-sm text-gray-500">
														{report.period} • {report.generatedBy}
													</div>
												</div>
											</div>
											<div className="flex items-center space-x-4">
												<Badge
													className={
														statusConfig[
															report.status as keyof typeof statusConfig
														]?.color
													}
												>
													<StatusIcon className="h-3 w-3 mr-1" />
													{report.status.replace("_", " ")}
												</Badge>
												<div className="text-sm text-gray-500">
													{report.generatedAt.toLocaleDateString()}
												</div>
												<Button variant="outline" size="sm">
													<Download className="h-4 w-4 mr-2" />
													{t("overview.recentReports.download")}
												</Button>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("overview.insights.threats.title")}</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<Alert>
									<TrendingDown className="h-4 w-4" />
									<AlertDescription>
										<strong>
											{t("overview.insights.threats.incident.title")}
										</strong>{" "}
										{t("overview.insights.threats.incident.description")}
									</AlertDescription>
								</Alert>

								<Alert>
									<Shield className="h-4 w-4" />
									<AlertDescription>
										<strong>
											{t("overview.insights.threats.blocked.title")}
										</strong>{" "}
										{t("overview.insights.threats.blocked.description")}
									</AlertDescription>
								</Alert>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{t("overview.insights.compliance.title")}</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<Alert>
									<CheckCircle className="h-4 w-4" />
									<AlertDescription>
										<strong>
											{t("overview.insights.compliance.gdpr.title")}
										</strong>{" "}
										{t("overview.insights.compliance.gdpr.description")}
									</AlertDescription>
								</Alert>

								<Alert>
									<CheckCircle className="h-4 w-4" />
									<AlertDescription>
										<strong>
											{t("overview.insights.compliance.ccpa.title")}
										</strong>{" "}
										{t("overview.insights.compliance.ccpa.description")}
									</AlertDescription>
								</Alert>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="reports" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("reports.title")}</CardTitle>
							<CardDescription>{t("reports.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("reports.table.title")}</TableHead>
										<TableHead>{t("reports.table.type")}</TableHead>
										<TableHead>{t("reports.table.status")}</TableHead>
										<TableHead>{t("reports.table.generated")}</TableHead>
										<TableHead>{t("reports.table.size")}</TableHead>
										<TableHead>{t("reports.table.actions")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reports.map((report) => {
										const StatusIcon =
											statusConfig[report.status as keyof typeof statusConfig]
												?.icon || Activity;
										const TypeIcon =
											reportTypes[report.type as keyof typeof reportTypes]
												?.icon || FileText;

										return (
											<TableRow key={report.id}>
												<TableCell>
													<div>
														<div className="font-medium">
															{report.title}
														</div>
														<div className="text-sm text-gray-500">
															ID: {report.id}
														</div>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center space-x-2">
														<TypeIcon className="h-4 w-4 text-blue-600" />
														<span className="text-sm">
															{
																reportTypes[
																	report.type as keyof typeof reportTypes
																]?.label
															}
														</span>
													</div>
												</TableCell>
												<TableCell>
													<Badge
														className={
															statusConfig[
																report.status as keyof typeof statusConfig
															]?.color
														}
													>
														<StatusIcon className="h-3 w-3 mr-1" />
														{report.status.replace("_", " ")}
													</Badge>
												</TableCell>
												<TableCell className="text-sm text-gray-500">
													{report.generatedAt.toLocaleDateString()}
												</TableCell>
												<TableCell className="text-sm">
													{report.size}
												</TableCell>
												<TableCell>
													<div className="flex space-x-2">
														<Button variant="outline" size="sm">
															<Eye className="h-4 w-4 mr-2" />
															{t("reports.view")}
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																exportReport(report.id, "pdf")
															}
														>
															<Download className="h-4 w-4 mr-2" />
															{t("reports.download")}
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

				<TabsContent value="analytics" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("analytics.incidents.title")}</CardTitle>
								<CardDescription>
									{t("analytics.incidents.description")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{analytics?.trends?.incidents?.map((point) => (
										<div
											key={point.date}
											className="flex items-center justify-between"
										>
											<span className="text-sm">
												{new Date(point.date).toLocaleDateString()}
											</span>
											<div className="flex items-center space-x-2">
												<div className="w-24 bg-gray-200 rounded-full h-2">
													<div
														className="bg-red-600 h-2 rounded-full"
														style={{
															width: `${((point.count ?? 0) / 15) * 100}%`,
														}}
													/>
												</div>
												<span className="text-sm font-medium w-8 text-right">
													{point.count}
												</span>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{t("analytics.response.title")}</CardTitle>
								<CardDescription>
									{t("analytics.response.description")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{analytics?.trends?.responseTime?.map((point) => (
										<div
											key={point.date}
											className="flex items-center justify-between"
										>
											<span className="text-sm">
												{new Date(point.date).toLocaleDateString()}
											</span>
											<div className="flex items-center space-x-2">
												<div className="w-24 bg-gray-200 rounded-full h-2">
													<div
														className="bg-blue-600 h-2 rounded-full"
														style={{
															width: `${((point.time ?? 0) / 80) * 100}%`,
														}}
													/>
												</div>
												<span className="text-sm font-medium w-8 text-right">
													{point.time}m
												</span>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("analytics.breakdown.incidentTypes")}</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{Object.entries(analytics?.breakdowns?.incidentTypes ?? {}).map(
										([type, count]) => (
											<div
												key={type}
												className="flex items-center justify-between"
											>
												<span className="text-sm capitalize">
													{type.replace("_", " ")}
												</span>
												<div className="flex items-center space-x-2">
													<div className="w-16 bg-gray-200 rounded-full h-2">
														<div
															className="bg-purple-600 h-2 rounded-full"
															style={{
																width: `${((count as number) / 67) * 100}%`,
															}}
														/>
													</div>
													<span className="text-sm font-medium w-6 text-right">
														{count as number}
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
								<CardTitle>{t("analytics.breakdown.severity")}</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{Object.entries(
										analytics?.breakdowns?.severityLevels ?? {}
									).map(([severity, count]) => (
										<div
											key={severity}
											className="flex items-center justify-between"
										>
											<Badge
												className={
													severity === "critical"
														? "bg-red-100 text-red-800"
														: severity === "high"
															? "bg-orange-100 text-orange-800"
															: severity === "medium"
																? "bg-yellow-100 text-yellow-800"
																: "bg-blue-100 text-blue-800"
												}
											>
												{severity}
											</Badge>
											<span className="text-sm font-medium">
												{count as number}
											</span>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{t("analytics.breakdown.departments")}</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{Object.entries(analytics?.breakdowns?.departments ?? {}).map(
										([dept, count]) => (
											<div
												key={dept}
												className="flex items-center justify-between"
											>
												<span className="text-sm capitalize">{dept}</span>
												<div className="flex items-center space-x-2">
													<div className="w-16 bg-gray-200 rounded-full h-2">
														<div
															className="bg-green-600 h-2 rounded-full"
															style={{
																width: `${((count as number) / 54) * 100}%`,
															}}
														/>
													</div>
													<span className="text-sm font-medium w-6 text-right">
														{count as number}
													</span>
												</div>
											</div>
										)
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="compliance" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{Object.entries(analytics?.compliance ?? {}).map(([framework, data]) => {
							const StatusIcon =
								complianceStatusConfig[
									data.status as keyof typeof complianceStatusConfig
								]?.icon || CheckCircle;

							return (
								<Card key={framework}>
									<CardHeader>
										<CardTitle className="uppercase">{framework}</CardTitle>
										<CardDescription>
											{t("compliance.lastAudit")}:{" "}
											{data.lastAudit.toLocaleDateString()}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">
												{t("compliance.score")}
											</span>
											<span className="text-lg font-bold text-green-600">
												{(data.score * 100).toFixed(1)}%
											</span>
										</div>

										<Progress value={data.score * 100} className="h-2" />

										<div className="flex items-center justify-between text-sm">
											<span>{t("compliance.findings")}</span>
											<Badge
												variant="outline"
												className={
													data.findings > 0
														? "text-yellow-600"
														: "text-green-600"
												}
											>
												{data.findings}
											</Badge>
										</div>

										<div className="flex items-center justify-between text-sm">
											<span>{t("compliance.nextAudit")}</span>
											<span className="text-gray-500">
												{data.nextAudit.toLocaleDateString()}
											</span>
										</div>

										<Badge
											className={
												complianceStatusConfig[
													data.status as keyof typeof complianceStatusConfig
												]?.color
											}
										>
											<StatusIcon className="h-3 w-3 mr-1" />
											{data.status}
										</Badge>
									</CardContent>
								</Card>
							);
						})}
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("compliance.actions.title")}</CardTitle>
							<CardDescription>{t("compliance.actions.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 border rounded-lg">
									<div>
										<div className="font-medium">
											{t("compliance.actions.scheduleAudit")}
										</div>
										<div className="text-sm text-gray-500">
											{t("compliance.actions.scheduleAuditDesc")}
										</div>
									</div>
									<Button variant="outline" size="sm">
										<Calendar className="h-4 w-4 mr-2" />
										{t("compliance.actions.schedule")}
									</Button>
								</div>

								<div className="flex items-center justify-between p-4 border rounded-lg">
									<div>
										<div className="font-medium">
											{t("compliance.actions.generateReport")}
										</div>
										<div className="text-sm text-gray-500">
											{t("compliance.actions.generateReportDesc")}
										</div>
									</div>
									<Button variant="outline" size="sm">
										<FileText className="h-4 w-4 mr-2" />
										{t("compliance.actions.generate")}
									</Button>
								</div>

								<div className="flex items-center justify-between p-4 border rounded-lg">
									<div>
										<div className="font-medium">
											{t("compliance.actions.reviewFindings")}
										</div>
										<div className="text-sm text-gray-500">
											{t("compliance.actions.reviewFindingsDesc")}
										</div>
									</div>
									<Button variant="outline" size="sm">
										<Eye className="h-4 w-4 mr-2" />
										{t("compliance.actions.review")}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="create" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("create.title")}</CardTitle>
							<CardDescription>{t("create.description")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<label className="text-sm font-medium">
										{t("create.reportType")}
									</label>
									<Select value={reportType} onValueChange={setReportType}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{Object.entries(reportTypes).map(([key, config]) => (
												<SelectItem key={key} value={key}>
													<div className="flex items-center space-x-2">
														<config.icon className="h-4 w-4" />
														<span>{config.label}</span>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">
										{t("create.dateRange")}
									</label>
									<DatePickerWithRange
										date={dateRange}
										onDateChange={setDateRange}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">
									{t("create.recipients")}
								</label>
								<div className="flex flex-wrap gap-2">
									{["CEO", "CTO", "CISO", "Security Team", "IT Operations"].map(
										(recipient) => (
											<Badge
												key={recipient}
												variant="outline"
												className="cursor-pointer hover:bg-blue-50"
											>
												{recipient}
											</Badge>
										)
									)}
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">{t("create.format")}</label>
								<div className="flex space-x-4">
									{["PDF", "Excel", "CSV"].map((format) => (
										<label
											key={format}
											className="flex items-center space-x-2 cursor-pointer"
										>
											<input
												type="radio"
												name="format"
												value={format.toLowerCase()}
												defaultChecked={format === "PDF"}
											/>
											<span className="text-sm">{format}</span>
										</label>
									))}
								</div>
							</div>

							<div className="flex space-x-4">
								<Button onClick={generateReport}>
									<FileText className="h-4 w-4 mr-2" />
									{t("create.generate")}
								</Button>
								<Button variant="outline" onClick={scheduleReport}>
									<Calendar className="h-4 w-4 mr-2" />
									{t("create.schedule")}
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{t("create.templates.title")}</CardTitle>
							<CardDescription>{t("create.templates.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{Object.entries(reportTypes).map(([key, config]) => (
									<div
										key={key}
										className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
									>
										<div className="flex items-center space-x-3 mb-3">
											<div className="p-2 bg-blue-100 rounded-lg">
												<config.icon className="h-5 w-5 text-blue-600" />
											</div>
											<div>
												<div className="font-medium">{config.label}</div>
												<div className="text-sm text-gray-500">
													{t(`create.templates.${key}.description`)}
												</div>
											</div>
										</div>
										<Button variant="outline" size="sm" className="w-full">
											{t("create.templates.use")}
										</Button>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
