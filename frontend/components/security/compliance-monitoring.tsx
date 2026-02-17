/**
 * Compliance Monitoring Component
 * Implements regulatory compliance monitoring and reporting
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
import { Checkbox } from "@/components/ui/checkbox";
import {
	FileCheck,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Clock,
	Shield,
	FileText,
	Calendar,
	Download,
	Eye,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ComplianceRequirement {
	id: string;
	name: string;
	status: string;
	score: number;
	lastChecked: Date;
	description: string;
}

interface ComplianceFramework {
	overallScore: number;
	status: string;
	lastAudit: Date;
	nextAudit: Date;
	requirements: ComplianceRequirement[];
}

interface AuditLog {
	id: string;
	type: string;
	framework: string;
	requirement: string;
	status: string;
	timestamp: Date;
	details: string;
}

interface ComplianceMonitoringProps {
	className?: string;
}

export function ComplianceMonitoring({ className = "" }: ComplianceMonitoringProps) {
	const t = useTranslations("compliance");
	const [activeTab, setActiveTab] = useState("overview");
	const [complianceData, setComplianceData] = useState<Record<string, ComplianceFramework>>({});
	const [selectedFramework, setSelectedFramework] = useState("gdpr");
	const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

	// Mock compliance data
	useEffect(() => {
		const mockCompliance = {
			gdpr: {
				overallScore: 87,
				status: "compliant",
				lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				nextAudit: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
				requirements: [
					{
						id: "gdpr-1",
						name: "Data Protection Officer",
						status: "compliant",
						score: 100,
						lastChecked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
						description: "Appointed qualified Data Protection Officer",
					},
					{
						id: "gdpr-2",
						name: "Privacy by Design",
						status: "compliant",
						score: 95,
						lastChecked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
						description: "Privacy considerations integrated into system design",
					},
					{
						id: "gdpr-3",
						name: "Data Subject Rights",
						status: "partial",
						score: 78,
						lastChecked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
						description: "Implementation of data subject access rights",
					},
					{
						id: "gdpr-4",
						name: "Data Breach Notification",
						status: "compliant",
						score: 92,
						lastChecked: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
						description: "72-hour breach notification process",
					},
					{
						id: "gdpr-5",
						name: "Data Processing Records",
						status: "compliant",
						score: 88,
						lastChecked: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
						description: "Maintained records of processing activities",
					},
				],
			},
			ccpa: {
				overallScore: 82,
				status: "compliant",
				lastAudit: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
				nextAudit: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
				requirements: [
					{
						id: "ccpa-1",
						name: "Privacy Notice",
						status: "compliant",
						score: 96,
						lastChecked: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
						description: "Clear privacy notice for California residents",
					},
					{
						id: "ccpa-2",
						name: "Do Not Sell",
						status: "compliant",
						score: 85,
						lastChecked: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
						description: "Do Not Sell mechanism implemented",
					},
					{
						id: "ccpa-3",
						name: "Data Deletion",
						status: "partial",
						score: 72,
						lastChecked: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
						description: "Right to deletion implementation",
					},
				],
			},
			sox: {
				overallScore: 91,
				status: "compliant",
				lastAudit: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
				nextAudit: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
				requirements: [
					{
						id: "sox-1",
						name: "Internal Controls",
						status: "compliant",
						score: 94,
						lastChecked: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
						description: "Effective internal control over financial reporting",
					},
					{
						id: "sox-2",
						name: "Financial Records",
						status: "compliant",
						score: 88,
						lastChecked: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
						description: "Accurate and complete financial records",
					},
				],
			},
		};

		const mockAuditLogs = [
			{
				id: "1",
				type: "automated_check",
				framework: "GDPR",
				requirement: "Data Subject Rights",
				status: "passed",
				timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
				details: "Automated verification of data export functionality",
			},
			{
				id: "2",
				type: "manual_review",
				framework: "CCPA",
				requirement: "Privacy Notice",
				status: "passed",
				timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
				details: "Manual review of privacy notice content and accessibility",
			},
			{
				id: "3",
				type: "automated_check",
				framework: "GDPR",
				requirement: "Data Breach Notification",
				status: "failed",
				timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
				details: "Notification system test failed - response time exceeded 72 hours",
			},
			{
				id: "4",
				type: "manual_review",
				framework: "SOX",
				requirement: "Internal Controls",
				status: "passed",
				timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
				details: "Quarterly internal controls assessment completed",
			},
			{
				id: "5",
				type: "automated_check",
				framework: "CCPA",
				requirement: "Do Not Sell",
				status: "passed",
				timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
				details: "Cookie consent and tracking opt-out verification",
			},
		];

		setComplianceData(mockCompliance);
		setAuditLogs(mockAuditLogs);
	}, []);

	const currentFramework = complianceData[selectedFramework] as ComplianceFramework | undefined;

	const getStatusColor = (status: string) => {
		const colors = {
			compliant: "bg-green-100 text-green-800",
			partial: "bg-yellow-100 text-yellow-800",
			non_compliant: "bg-red-100 text-red-800",
			pending: "bg-blue-100 text-blue-800",
		};
		return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "passed":
				return <CheckCircle className="h-4 w-4 text-green-600" />;
			case "failed":
				return <XCircle className="h-4 w-4 text-red-600" />;
			case "pending":
				return <Clock className="h-4 w-4 text-yellow-600" />;
			default:
				return <AlertTriangle className="h-4 w-4 text-gray-600" />;
		}
	};

	const getScoreColor = (score: number) => {
		if (score >= 90) return "text-green-600";
		if (score >= 80) return "text-yellow-600";
		if (score >= 70) return "text-orange-600";
		return "text-red-600";
	};

	const frameworkOptions = [
		{ value: "gdpr", label: "GDPR", description: "General Data Protection Regulation" },
		{ value: "ccpa", label: "CCPA", description: "California Consumer Privacy Act" },
		{ value: "sox", label: "SOX", description: "Sarbanes-Oxley Act" },
	];

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center space-x-2">
						<FileCheck className="h-6 w-6" />
						<span>{t("complianceMonitoring.title")}</span>
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						{t("complianceMonitoring.subtitle")}
					</p>
				</div>
				<div className="flex items-center space-x-4">
					<Select value={selectedFramework} onValueChange={setSelectedFramework}>
						<SelectTrigger className="w-48">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{frameworkOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									<div>
										<div className="font-medium">{option.label}</div>
										<div className="text-xs text-gray-500">
											{option.description}
										</div>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button variant="outline" size="sm">
						<Download className="h-4 w-4 mr-2" />
						{t("exportReport")}
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
					<TabsTrigger value="requirements">{t("tabs.requirements")}</TabsTrigger>
					<TabsTrigger value="audit">{t("tabs.audit")}</TabsTrigger>
					<TabsTrigger value="reports">{t("tabs.reports")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.overallScore")}
										</p>
										<p className="text-2xl font-bold">
											{currentFramework?.overallScore ?? 0}%
										</p>
									</div>
									<Shield className="h-8 w-8 text-blue-500" />
								</div>
								<div className="mt-4">
									<Progress
										value={currentFramework?.overallScore ?? 0}
										className="h-2"
									/>
									<div className="flex items-center justify-between text-xs text-gray-500 mt-1">
										<span>{t("metrics.complianceLevel")}</span>
										<Badge
											className={getStatusColor(
												currentFramework?.status ?? ""
											)}
										>
											{currentFramework?.status}
										</Badge>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.lastAudit")}
										</p>
										<p className="text-lg font-bold">
											{currentFramework?.lastAudit?.toLocaleDateString() ??
												"N/A"}
										</p>
									</div>
									<Calendar className="h-8 w-8 text-green-500" />
								</div>
								<div className="mt-4 text-sm text-gray-500">
									{currentFramework?.lastAudit
										? `${Math.floor((Date.now() - currentFramework.lastAudit.getTime()) / (1000 * 60 * 60 * 24))} days ago`
										: "No audit performed"}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.nextAudit")}
										</p>
										<p className="text-lg font-bold">
											{currentFramework?.nextAudit?.toLocaleDateString() ??
												"N/A"}
										</p>
									</div>
									<Clock className="h-8 w-8 text-orange-500" />
								</div>
								<div className="mt-4 text-sm text-gray-500">
									{currentFramework?.nextAudit
										? `${Math.floor((currentFramework.nextAudit.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining`
										: "Schedule audit"}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.requirements")}
										</p>
										<p className="text-2xl font-bold">
											{currentFramework?.requirements?.filter(
												(r) => r.status === "compliant"
											).length ?? 0}
											/{currentFramework?.requirements?.length ?? 0}
										</p>
									</div>
									<FileText className="h-8 w-8 text-purple-500" />
								</div>
								<div className="mt-4">
									<Progress
										value={
											((currentFramework?.requirements?.filter(
												(r) => r.status === "compliant"
											).length ?? 0) /
												(currentFramework?.requirements?.length || 1)) *
											100
										}
										className="h-2"
									/>
									<p className="text-xs text-gray-500 mt-1">
										{t("metrics.compliantRequirements")}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("frameworkStatus.title")}</CardTitle>
							<CardDescription>{t("frameworkStatus.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{Object.entries(complianceData).map(([key, framework]) => {
									const frameworkInfo = frameworkOptions.find(
										(f) => f.value === key
									);
									return (
										<div key={key} className="p-4 border rounded-lg">
											<div className="flex items-center justify-between mb-3">
												<div>
													<div className="font-medium">
														{frameworkInfo?.label}
													</div>
													<div className="text-sm text-gray-500">
														{frameworkInfo?.description}
													</div>
												</div>
												<Badge className={getStatusColor(framework.status)}>
													{framework.status}
												</Badge>
											</div>
											<div className="space-y-2">
												<div className="flex items-center justify-between text-sm">
													<span>{t("frameworkStatus.score")}</span>
													<span
														className={`font-medium ${getScoreColor(framework.overallScore)}`}
													>
														{framework.overallScore}%
													</span>
												</div>
												<Progress
													value={framework.overallScore}
													className="h-2"
												/>
												<div className="text-xs text-gray-500">
													{t("frameworkStatus.lastAudit")}:{" "}
													{framework.lastAudit?.toLocaleDateString()}
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
							<CardTitle>{t("recentActivity.title")}</CardTitle>
							<CardDescription>{t("recentActivity.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{auditLogs.slice(0, 5).map((log) => (
									<div
										key={log.id}
										className="flex items-center justify-between p-4 border rounded-lg"
									>
										<div className="flex items-center space-x-4">
											{getStatusIcon(log.status)}
											<div>
												<div className="flex items-center space-x-2">
													<span className="font-medium">
														{log.framework} - {log.requirement}
													</span>
													<Badge variant="outline" className="text-xs">
														{log.type.replace("_", " ")}
													</Badge>
												</div>
												<div className="text-sm text-gray-500">
													{log.details}
												</div>
											</div>
										</div>
										<div className="text-right">
											<div className="text-sm text-gray-500">
												{log.timestamp.toLocaleString()}
											</div>
											<Badge
												className={
													log.status === "passed"
														? "bg-green-100 text-green-800"
														: log.status === "failed"
															? "bg-red-100 text-red-800"
															: "bg-yellow-100 text-yellow-800"
												}
											>
												{log.status}
											</Badge>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="requirements" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("requirements.title")}</CardTitle>
							<CardDescription>{t("requirements.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("requirements.table.requirement")}</TableHead>
										<TableHead>{t("requirements.table.status")}</TableHead>
										<TableHead>{t("requirements.table.score")}</TableHead>
										<TableHead>{t("requirements.table.lastChecked")}</TableHead>
										<TableHead>{t("requirements.table.actions")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{currentFramework?.requirements?.map((req) => (
										<TableRow key={req.id}>
											<TableCell>
												<div>
													<div className="font-medium">{req.name}</div>
													<div className="text-sm text-gray-500">
														{req.description}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Badge className={getStatusColor(req.status)}>
													{req.status}
												</Badge>
											</TableCell>
											<TableCell>
												<span
													className={`font-medium ${getScoreColor(req.score)}`}
												>
													{req.score}%
												</span>
											</TableCell>
											<TableCell className="text-sm text-gray-500">
												{req.lastChecked.toLocaleDateString()}
											</TableCell>
											<TableCell>
												<Button variant="outline" size="sm">
													<Eye className="h-4 w-4 mr-2" />
													{t("requirements.viewDetails")}
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="audit" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("audit.title")}</CardTitle>
							<CardDescription>{t("audit.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("audit.table.timestamp")}</TableHead>
										<TableHead>{t("audit.table.framework")}</TableHead>
										<TableHead>{t("audit.table.requirement")}</TableHead>
										<TableHead>{t("audit.table.type")}</TableHead>
										<TableHead>{t("audit.table.status")}</TableHead>
										<TableHead>{t("audit.table.details")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{auditLogs.map((log) => (
										<TableRow key={log.id}>
											<TableCell className="text-sm">
												{log.timestamp.toLocaleString()}
											</TableCell>
											<TableCell className="font-medium">
												{log.framework}
											</TableCell>
											<TableCell>{log.requirement}</TableCell>
											<TableCell>
												<Badge variant="outline" className="text-xs">
													{log.type.replace("_", " ")}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													{getStatusIcon(log.status)}
													<span className="text-sm capitalize">
														{log.status}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-sm text-gray-500 max-w-xs truncate">
												{log.details}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="reports" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("reports.generation.title")}</CardTitle>
								<CardDescription>
									{t("reports.generation.description")}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="flex items-center space-x-2">
										<Checkbox id="gdpr-report" defaultChecked={true} />
										<label htmlFor="gdpr-report" className="text-sm">
											GDPR Compliance Report
										</label>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox id="ccpa-report" defaultChecked={true} />
										<label htmlFor="ccpa-report" className="text-sm">
											CCPA Compliance Report
										</label>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox id="sox-report" />
										<label htmlFor="sox-report" className="text-sm">
											SOX Compliance Report
										</label>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox id="audit-trail" defaultChecked={true} />
										<label htmlFor="audit-trail" className="text-sm">
											Audit Trail Report
										</label>
									</div>
								</div>
								<div className="pt-4 border-t">
									<Button className="w-full">
										<Download className="h-4 w-4 mr-2" />
										{t("reports.generateReport")}
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{t("reports.scheduled.title")}</CardTitle>
								<CardDescription>
									{t("reports.scheduled.description")}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="flex items-center justify-between p-3 border rounded-lg">
										<div>
											<div className="font-medium">
												Monthly Compliance Summary
											</div>
											<div className="text-sm text-gray-500">
												Generated on the 1st of each month
											</div>
										</div>
										<Badge className="bg-green-100 text-green-800">
											Active
										</Badge>
									</div>

									<div className="flex items-center justify-between p-3 border rounded-lg">
										<div>
											<div className="font-medium">
												Quarterly Audit Report
											</div>
											<div className="text-sm text-gray-500">
												Generated quarterly for SOX compliance
											</div>
										</div>
										<Badge className="bg-green-100 text-green-800">
											Active
										</Badge>
									</div>

									<div className="flex items-center justify-between p-3 border rounded-lg">
										<div>
											<div className="font-medium">
												Annual GDPR Assessment
											</div>
											<div className="text-sm text-gray-500">
												Comprehensive annual review
											</div>
										</div>
										<Badge className="bg-yellow-100 text-yellow-800">
											Pending
										</Badge>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("alerts.title")}</CardTitle>
							<CardDescription>{t("alerts.description")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Alert>
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription>
									<strong>{t("alerts.upcomingAudit.title")}</strong>{" "}
									{t("alerts.upcomingAudit.description")}
								</AlertDescription>
							</Alert>

							<Alert>
								<Clock className="h-4 w-4" />
								<AlertDescription>
									<strong>{t("alerts.requirementReview.title")}</strong>{" "}
									{t("alerts.requirementReview.description")}
								</AlertDescription>
							</Alert>

							<Alert>
								<CheckCircle className="h-4 w-4" />
								<AlertDescription>
									<strong>{t("alerts.complianceMilestone.title")}</strong>{" "}
									{t("alerts.complianceMilestone.description")}
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
