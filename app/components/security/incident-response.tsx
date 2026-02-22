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
	AlertTriangle,
	Shield,
	Clock,
	Users,
	Activity,
	CheckCircle,
	XCircle,
	FileText,
	MessageSquare,
	Mail,
	TrendingUp,
	TrendingDown,
	Target,
	Zap,
	Eye,
	Lock,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface TimelineEntry {
	timestamp: Date;
	action: string;
	actor: string;
}

interface Incident {
	id: string;
	title: string;
	description: string;
	severity: string;
	status: string;
	type: string;
	reportedBy: string;
	assignedTo: string;
	createdAt: Date;
	updatedAt: Date;
	sla: number;
	progress: number;
	affectedUsers: number;
	containmentStatus: string;
	resolution: string | null;
	timeline: TimelineEntry[];
}

interface ResponseTeam {
	id: string;
	name: string;
	lead: string;
	members: number;
	specialization: string;
	status: string;
	activeIncidents: number;
	responseTime: number;
}

interface MonthlyTrend {
	month: string;
	incidents: number;
}

interface IncidentMetrics {
	totalIncidents: number;
	activeIncidents: number;
	resolvedIncidents: number;
	criticalIncidents: number;
	avgResponseTime: number;
	avgResolutionTime: number;
	slaCompliance: number;
	falsePositives: number;
	incidentTypes: Record<string, number>;
	severityDistribution: Record<string, number>;
	monthlyTrend: MonthlyTrend[];
}

interface IncidentResponseProps {
	className?: string;
}

export function IncidentResponse({ className = "" }: IncidentResponseProps) {
	const t = useTranslations("incidentResponse");
	const [activeTab, setActiveTab] = useState("active");
	const [incidents, setIncidents] = useState<Incident[]>([]);
	const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>([]);
	const [incidentMetrics, setIncidentMetrics] = useState<IncidentMetrics | null>(null);

	// Mock incident data
	useEffect(() => {
		const mockIncidents = [
			{
				id: "INC-2024-001",
				title: "Suspicious Login Attempts",
				description: "Multiple failed login attempts from unusual geographic locations",
				severity: "high",
				status: "investigating",
				type: "authentication",
				reportedBy: "Security System",
				assignedTo: "Security Team Alpha",
				createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
				updatedAt: new Date(Date.now() - 30 * 60 * 1000),
				sla: 4, // hours
				progress: 65,
				affectedUsers: 3,
				containmentStatus: "partial",
				resolution: null,
				timeline: [
					{
						timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
						action: "Incident detected",
						actor: "Automated System",
					},
					{
						timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
						action: "Alert sent to security team",
						actor: "System",
					},
					{
						timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
						action: "Initial investigation started",
						actor: "Security Team Alpha",
					},
					{
						timestamp: new Date(Date.now() - 30 * 60 * 1000),
						action: "Affected accounts identified",
						actor: "Alice Johnson",
					},
				],
			},
			{
				id: "INC-2024-002",
				title: "Potential Data Breach",
				description: "Unusual data access patterns detected in user database",
				severity: "critical",
				status: "contained",
				type: "data_breach",
				reportedBy: "Data Monitoring System",
				assignedTo: "Incident Response Team",
				createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
				updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
				sla: 1, // hour
				progress: 90,
				affectedUsers: 127,
				containmentStatus: "full",
				resolution: "Database access temporarily restricted, investigation ongoing",
				timeline: [
					{
						timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
						action: "Anomaly detected",
						actor: "Automated System",
					},
					{
						timestamp: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
						action: "Critical alert triggered",
						actor: "System",
					},
					{
						timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
						action: "Emergency response initiated",
						actor: "Incident Response Team",
					},
					{
						timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
						action: "Database access isolated",
						actor: "Bob Smith",
					},
					{
						timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
						action: "Containment confirmed",
						actor: "Charlie Brown",
					},
				],
			},
			{
				id: "INC-2024-003",
				title: "Phishing Email Campaign",
				description: "Coordinated phishing emails targeting multiple users",
				severity: "medium",
				status: "resolved",
				type: "phishing",
				reportedBy: "User Report",
				assignedTo: "Security Awareness Team",
				createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
				updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
				sla: 24, // hours
				progress: 100,
				affectedUsers: 15,
				containmentStatus: "full",
				resolution: "Email filters updated, users notified, training session scheduled",
				timeline: [
					{
						timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
						action: "User reported suspicious email",
						actor: "Diana Prince",
					},
					{
						timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
						action: "Investigation initiated",
						actor: "Security Awareness Team",
					},
					{
						timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
						action: "Email pattern identified",
						actor: "Eve Wilson",
					},
					{
						timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
						action: "Resolution implemented",
						actor: "Security Team",
					},
				],
			},
		];

		const mockTeams = [
			{
				id: "1",
				name: "Security Team Alpha",
				lead: "Alice Johnson",
				members: 5,
				specialization: "Authentication & Access",
				status: "active",
				activeIncidents: 1,
				responseTime: 45, // minutes
			},
			{
				id: "2",
				name: "Incident Response Team",
				lead: "Bob Smith",
				members: 8,
				specialization: "Critical Incidents",
				status: "active",
				activeIncidents: 1,
				responseTime: 15, // minutes
			},
			{
				id: "3",
				name: "Security Awareness Team",
				lead: "Charlie Brown",
				members: 4,
				specialization: "User Education",
				status: "active",
				activeIncidents: 0,
				responseTime: 120, // minutes
			},
		];

		const mockMetrics = {
			totalIncidents: 47,
			activeIncidents: 2,
			resolvedIncidents: 43,
			criticalIncidents: 5,
			avgResponseTime: 67, // minutes
			avgResolutionTime: 8.5, // hours
			slaCompliance: 0.89,
			falsePositives: 12,
			incidentTypes: {
				authentication: 18,
				data_breach: 8,
				phishing: 12,
				malware: 5,
				ddos: 2,
				other: 2,
			},
			severityDistribution: {
				critical: 5,
				high: 15,
				medium: 22,
				low: 5,
			},
			monthlyTrend: [
				{ month: "Jan", incidents: 8 },
				{ month: "Feb", incidents: 12 },
				{ month: "Mar", incidents: 6 },
				{ month: "Apr", incidents: 9 },
				{ month: "May", incidents: 7 },
				{ month: "Jun", incidents: 5 },
			],
		};

		setIncidents(mockIncidents);
		setResponseTeams(mockTeams);
		setIncidentMetrics(mockMetrics);
	}, []);

	const severityConfig = {
		low: { color: "bg-blue-100 text-blue-800", icon: AlertTriangle },
		medium: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
		high: { color: "bg-orange-100 text-orange-800", icon: AlertTriangle },
		critical: { color: "bg-red-100 text-red-800", icon: XCircle },
	};

	const statusConfig = {
		investigating: { color: "bg-blue-100 text-blue-800", icon: Activity },
		contained: { color: "bg-yellow-100 text-yellow-800", icon: Shield },
		resolved: { color: "bg-green-100 text-green-800", icon: CheckCircle },
		closed: { color: "bg-gray-100 text-gray-800", icon: XCircle },
	};

	const typeConfig = {
		authentication: { icon: Lock, color: "text-blue-600" },
		data_breach: { icon: Shield, color: "text-red-600" },
		phishing: { icon: Mail, color: "text-orange-600" },
		malware: { icon: Zap, color: "text-purple-600" },
		ddos: { icon: Activity, color: "text-green-600" },
		other: { icon: AlertTriangle, color: "text-gray-600" },
	};

	const getTimeRemaining = (createdAt: Date, sla: number) => {
		const elapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60); // hours
		const remaining = sla - elapsed;
		return remaining > 0 ? remaining : 0;
	};

	const getSlaStatus = (createdAt: Date, sla: number) => {
		const remaining = getTimeRemaining(createdAt, sla);
		if (remaining > sla * 0.5) return "good";
		if (remaining > 0) return "warning";
		return "breached";
	};

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center space-x-2">
						<Shield className="h-6 w-6" />
						<span>{t("incidentResponse.title")}</span>
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						{t("incidentResponse.subtitle")}
					</p>
				</div>
				<div className="flex items-center space-x-4">
					<Button variant="outline" size="sm">
						<FileText className="h-4 w-4 mr-2" />
						{t("createIncident")}
					</Button>
					<Badge variant="outline" className="bg-red-50 text-red-700">
						<AlertTriangle className="h-3 w-3 mr-1" />
						{incidentMetrics?.activeIncidents ?? 0} {t("activeIncidents")}
					</Badge>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="active">{t("tabs.active")}</TabsTrigger>
					<TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
					<TabsTrigger value="teams">{t("tabs.teams")}</TabsTrigger>
					<TabsTrigger value="analytics">{t("tabs.analytics")}</TabsTrigger>
				</TabsList>

				<TabsContent value="active" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.activeIncidents")}
										</p>
										<p className="text-2xl font-bold text-red-600">
											{incidentMetrics?.activeIncidents ?? 0}
										</p>
									</div>
									<AlertTriangle className="h-8 w-8 text-red-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingDown className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">-15%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.vsLastWeek")}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.avgResponseTime")}
										</p>
										<p className="text-2xl font-bold">
											{incidentMetrics?.avgResponseTime ?? 0}m
										</p>
									</div>
									<Clock className="h-8 w-8 text-blue-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingDown className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">-8%</span>
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
											{t("metrics.slaCompliance")}
										</p>
										<p className="text-2xl font-bold text-green-600">
											{((incidentMetrics?.slaCompliance ?? 0) * 100).toFixed(
												1
											)}
											%
										</p>
									</div>
									<CheckCircle className="h-8 w-8 text-green-500" />
								</div>
								<div className="mt-4">
									<Progress
										value={(incidentMetrics?.slaCompliance ?? 0) * 100}
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
											{t("metrics.resolvedToday")}
										</p>
										<p className="text-2xl font-bold text-purple-600">3</p>
									</div>
									<Target className="h-8 w-8 text-purple-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">+25%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.efficiency")}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("activeIncidents.title")}</CardTitle>
							<CardDescription>{t("activeIncidents.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								{incidents
									.filter((inc) => inc.status !== "resolved")
									.map((incident) => {
										const SeverityIcon =
											severityConfig[
												incident.severity as keyof typeof severityConfig
											]?.icon || AlertTriangle;
										const StatusIcon =
											statusConfig[
												incident.status as keyof typeof statusConfig
											]?.icon || Activity;
										const TypeIcon =
											typeConfig[incident.type as keyof typeof typeConfig]
												?.icon || AlertTriangle;
										const slaStatus = getSlaStatus(
											incident.createdAt,
											incident.sla
										);

										return (
											<div
												key={incident.id}
												className="border rounded-lg p-6"
											>
												<div className="flex items-center justify-between mb-4">
													<div className="flex items-center space-x-4">
														<div
															className={`p-2 rounded-full ${
																incident.severity === "critical"
																	? "bg-red-100"
																	: incident.severity === "high"
																		? "bg-orange-100"
																		: incident.severity ===
																				"medium"
																			? "bg-yellow-100"
																			: "bg-blue-100"
															}`}
														>
															<SeverityIcon
																className={`h-5 w-5 ${
																	incident.severity === "critical"
																		? "text-red-600"
																		: incident.severity ===
																				"high"
																			? "text-orange-600"
																			: incident.severity ===
																					"medium"
																				? "text-yellow-600"
																				: "text-blue-600"
																}`}
															/>
														</div>
														<div>
															<div className="flex items-center space-x-2">
																<span className="font-medium">
																	{incident.title}
																</span>
																<Badge
																	className={
																		severityConfig[
																			incident.severity as keyof typeof severityConfig
																		]?.color
																	}
																>
																	{incident.severity}
																</Badge>
																<Badge
																	className={
																		statusConfig[
																			incident.status as keyof typeof statusConfig
																		]?.color
																	}
																>
																	<StatusIcon className="h-3 w-3 mr-1" />
																	{incident.status}
																</Badge>
															</div>
															<div className="text-sm text-gray-500">
																ID: {incident.id}
															</div>
														</div>
													</div>
													<div className="text-right">
														<div
															className={`text-sm font-medium ${
																slaStatus === "good"
																	? "text-green-600"
																	: slaStatus === "warning"
																		? "text-yellow-600"
																		: "text-red-600"
															}`}
														>
															{getTimeRemaining(
																incident.createdAt,
																incident.sla
															).toFixed(1)}
															h remaining
														</div>
														<div className="text-xs text-gray-500">
															SLA: {incident.sla}h
														</div>
													</div>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
													<div className="flex items-center space-x-2">
														<TypeIcon
															className={`h-4 w-4 ${typeConfig[incident.type as keyof typeof typeConfig]?.color}`}
														/>
														<span className="text-sm capitalize">
															{incident.type.replace("_", " ")}
														</span>
													</div>
													<div className="text-sm">
														<span className="text-gray-500">
															{t("activeIncidents.assignedTo")}:
														</span>{" "}
														{incident.assignedTo}
													</div>
													<div className="text-sm">
														<span className="text-gray-500">
															{t("activeIncidents.affectedUsers")}:
														</span>{" "}
														{incident.affectedUsers}
													</div>
												</div>

												<div className="mb-4">
													<div className="flex items-center justify-between text-sm mb-2">
														<span>{t("activeIncidents.progress")}</span>
														<span>{incident.progress}%</span>
													</div>
													<Progress
														value={incident.progress}
														className="h-2"
													/>
												</div>

												<div className="flex items-center justify-between">
													<div className="text-sm text-gray-600">
														{incident.description}
													</div>
													<div className="flex space-x-2">
														<Button variant="outline" size="sm">
															<Eye className="h-4 w-4 mr-2" />
															{t("activeIncidents.viewDetails")}
														</Button>
														<Button variant="outline" size="sm">
															<MessageSquare className="h-4 w-4 mr-2" />
															{t("activeIncidents.addNote")}
														</Button>
													</div>
												</div>
											</div>
										);
									})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="all" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("allIncidents.title")}</CardTitle>
							<CardDescription>{t("allIncidents.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("allIncidents.table.id")}</TableHead>
										<TableHead>{t("allIncidents.table.title")}</TableHead>
										<TableHead>{t("allIncidents.table.severity")}</TableHead>
										<TableHead>{t("allIncidents.table.status")}</TableHead>
										<TableHead>{t("allIncidents.table.assignedTo")}</TableHead>
										<TableHead>{t("allIncidents.table.created")}</TableHead>
										<TableHead>{t("allIncidents.table.actions")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{incidents.map((incident) => {
										const SeverityIcon =
											severityConfig[
												incident.severity as keyof typeof severityConfig
											]?.icon || AlertTriangle;
										const StatusIcon =
											statusConfig[
												incident.status as keyof typeof statusConfig
											]?.icon || Activity;

										return (
											<TableRow key={incident.id}>
												<TableCell className="font-mono text-sm">
													{incident.id}
												</TableCell>
												<TableCell>
													<div>
														<div className="font-medium">
															{incident.title}
														</div>
														<div className="text-sm text-gray-500">
															{incident.type.replace("_", " ")}
														</div>
													</div>
												</TableCell>
												<TableCell>
													<Badge
														className={
															severityConfig[
																incident.severity as keyof typeof severityConfig
															]?.color
														}
													>
														<SeverityIcon className="h-3 w-3 mr-1" />
														{incident.severity}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														className={
															statusConfig[
																incident.status as keyof typeof statusConfig
															]?.color
														}
													>
														<StatusIcon className="h-3 w-3 mr-1" />
														{incident.status}
													</Badge>
												</TableCell>
												<TableCell className="text-sm">
													{incident.assignedTo}
												</TableCell>
												<TableCell className="text-sm text-gray-500">
													{incident.createdAt.toLocaleDateString()}
												</TableCell>
												<TableCell>
													<Button variant="outline" size="sm">
														<Eye className="h-4 w-4 mr-2" />
														{t("allIncidents.view")}
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="teams" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("teams.title")}</CardTitle>
							<CardDescription>{t("teams.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{responseTeams.map((team) => (
									<div key={team.id} className="p-4 border rounded-lg">
										<div className="flex items-center justify-between mb-3">
											<h3 className="font-medium">{team.name}</h3>
											<Badge
												variant="outline"
												className="bg-green-50 text-green-700"
											>
												<Users className="h-3 w-3 mr-1" />
												{team.members}
											</Badge>
										</div>

										<div className="space-y-2 text-sm">
											<div className="flex items-center justify-between">
												<span className="text-gray-500">
													{t("teams.lead")}:
												</span>
												<span>{team.lead}</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-gray-500">
													{t("teams.specialization")}:
												</span>
												<span>{team.specialization}</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-gray-500">
													{t("teams.activeIncidents")}:
												</span>
												<span
													className={
														team.activeIncidents > 0
															? "text-red-600 font-medium"
															: "text-green-600"
													}
												>
													{team.activeIncidents}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-gray-500">
													{t("teams.responseTime")}:
												</span>
												<span>{team.responseTime}min</span>
											</div>
										</div>

										<div className="mt-4 pt-4 border-t">
											<Button variant="outline" size="sm" className="w-full">
												<MessageSquare className="h-4 w-4 mr-2" />
												{t("teams.contact")}
											</Button>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="analytics" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("analytics.types.title")}</CardTitle>
								<CardDescription>
									{t("analytics.types.description")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{Object.entries(incidentMetrics?.incidentTypes ?? {}).map(
										([type, count]) => {
											const config =
												typeConfig[type as keyof typeof typeConfig];
											const Icon = config?.icon || AlertTriangle;

											return (
												<div
													key={type}
													className="flex items-center justify-between"
												>
													<div className="flex items-center space-x-3">
														<Icon
															className={`h-5 w-5 ${config?.color}`}
														/>
														<span className="text-sm capitalize">
															{type.replace("_", " ")}
														</span>
													</div>
													<div className="flex items-center space-x-2">
														<div className="w-24 bg-gray-200 rounded-full h-2">
															<div
																className="bg-blue-600 h-2 rounded-full"
																style={{
																	width: `${(count / (incidentMetrics?.totalIncidents ?? 1)) * 100}%`,
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
								<CardTitle>{t("analytics.severity.title")}</CardTitle>
								<CardDescription>
									{t("analytics.severity.description")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{Object.entries(
										incidentMetrics?.severityDistribution ?? {}
									).map(([severity, count]) => (
										<div
											key={severity}
											className="flex items-center justify-between"
										>
											<Badge
												className={
													severityConfig[
														severity as keyof typeof severityConfig
													]?.color
												}
											>
												{severity}
											</Badge>
											<div className="flex items-center space-x-2">
												<div className="w-24 bg-gray-200 rounded-full h-2">
													<div
														className={`h-2 rounded-full ${
															severity === "critical"
																? "bg-red-500"
																: severity === "high"
																	? "bg-orange-500"
																	: severity === "medium"
																		? "bg-yellow-500"
																		: "bg-blue-500"
														}`}
														style={{
															width: `${(count / (incidentMetrics?.totalIncidents ?? 1)) * 100}%`,
														}}
													/>
												</div>
												<span className="text-sm font-medium w-8 text-right">
													{count}
												</span>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("analytics.trend.title")}</CardTitle>
							<CardDescription>{t("analytics.trend.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{incidentMetrics?.monthlyTrend?.map((month) => (
									<div
										key={month.month}
										className="flex items-center justify-between"
									>
										<span className="text-sm font-medium">{month.month}</span>
										<div className="flex items-center space-x-2">
											<div className="w-32 bg-gray-200 rounded-full h-2">
												<div
													className="bg-red-600 h-2 rounded-full"
													style={{
														width: `${(month.incidents / 15) * 100}%`,
													}}
												/>
											</div>
											<span className="text-sm font-medium w-8 text-right">
												{month.incidents}
											</span>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{t("analytics.insights.title")}</CardTitle>
							<CardDescription>{t("analytics.insights.description")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Alert>
								<TrendingDown className="h-4 w-4" />
								<AlertDescription>
									<strong>{t("analytics.insights.response.title")}</strong>{" "}
									{t("analytics.insights.response.description")}
								</AlertDescription>
							</Alert>

							<Alert>
								<CheckCircle className="h-4 w-4" />
								<AlertDescription>
									<strong>{t("analytics.insights.sla.title")}</strong>{" "}
									{t("analytics.insights.sla.description")}
								</AlertDescription>
							</Alert>

							<Alert>
								<Shield className="h-4 w-4" />
								<AlertDescription>
									<strong>{t("analytics.insights.containment.title")}</strong>{" "}
									{t("analytics.insights.containment.description")}
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
