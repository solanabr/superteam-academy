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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Zap,
	Pause,
	Settings,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Clock,
	Activity,
	Shield,
	Bot,
	Workflow,
	GitBranch,
	Timer,
	Users,
	Mail,
	MessageSquare,
	Lock,
	Eye,
	FileText,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface WorkflowStep {
	name: string;
	status: string;
	duration: number;
}

interface ActiveWorkflow {
	id: string;
	name: string;
	status: string;
	steps: WorkflowStep[];
	triggeredBy: string;
	startedAt: Date;
	estimatedCompletion?: Date;
	completedAt?: Date;
}

interface AutomationRule {
	id: string;
	name: string;
	trigger: string;
	actions: string[];
	enabled: boolean;
	priority: string;
	successRate: number;
	avgResponseTime: number;
	executions: number;
	lastExecuted: Date;
	description: string;
}

interface WorkflowCounts {
	running: number;
	completed: number;
	failed: number;
	pending: number;
}

interface AutomationMetrics {
	totalRules: number;
	activeRules: number;
	totalExecutions: number;
	successRate: number;
	avgResponseTime: number;
	incidentsPrevented: number;
	falsePositives: number;
	automationCoverage: number;
	workflows: WorkflowCounts;
}

interface SecurityAutomationProps {
	className?: string;
}

export function SecurityAutomation({ className = "" }: SecurityAutomationProps) {
	const t = useTranslations("securityAutomation");
	const [activeTab, setActiveTab] = useState("workflows");
	const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
	const [activeWorkflows, setActiveWorkflows] = useState<ActiveWorkflow[]>([]);
	const [automationMetrics, setAutomationMetrics] = useState<AutomationMetrics>({
		totalRules: 0,
		activeRules: 0,
		totalExecutions: 0,
		successRate: 0,
		avgResponseTime: 0,
		incidentsPrevented: 0,
		falsePositives: 0,
		automationCoverage: 0,
		workflows: { running: 0, completed: 0, failed: 0, pending: 0 },
	});

	// Mock automation data
	useEffect(() => {
		const mockRules = [
			{
				id: "1",
				name: "Suspicious Login Detection",
				trigger: "login_anomaly",
				actions: ["send_alert", "require_mfa", "log_incident"],
				enabled: true,
				priority: "high",
				successRate: 0.94,
				avgResponseTime: 45, // seconds
				executions: 127,
				lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000),
				description: "Automated response to suspicious login attempts",
			},
			{
				id: "2",
				name: "Data Breach Response",
				trigger: "data_breach_detected",
				actions: ["isolate_system", "notify_compliance", "initiate_investigation"],
				enabled: true,
				priority: "critical",
				successRate: 0.98,
				avgResponseTime: 120,
				executions: 3,
				lastExecuted: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				description: "Immediate response protocol for data breach incidents",
			},
			{
				id: "3",
				name: "Failed Login Lockout",
				trigger: "multiple_failed_logins",
				actions: ["temporary_lockout", "send_notification", "log_security_event"],
				enabled: true,
				priority: "medium",
				successRate: 0.89,
				avgResponseTime: 30,
				executions: 45,
				lastExecuted: new Date(Date.now() - 30 * 60 * 1000),
				description: "Account protection against brute force attacks",
			},
			{
				id: "4",
				name: "High-Risk User Monitoring",
				trigger: "user_risk_score_change",
				actions: ["increase_monitoring", "require_additional_verification"],
				enabled: false,
				priority: "medium",
				successRate: 0.76,
				avgResponseTime: 300,
				executions: 12,
				lastExecuted: new Date(Date.now() - 6 * 60 * 60 * 1000),
				description: "Enhanced monitoring for users with elevated risk scores",
			},
			{
				id: "5",
				name: "Compliance Violation Alert",
				trigger: "compliance_violation",
				actions: ["generate_report", "notify_auditor", "create_remediation_task"],
				enabled: true,
				priority: "high",
				successRate: 0.92,
				avgResponseTime: 180,
				executions: 8,
				lastExecuted: new Date(Date.now() - 12 * 60 * 60 * 1000),
				description: "Automated compliance monitoring and reporting",
			},
		];

		const mockWorkflows = [
			{
				id: "wf-1",
				name: "Incident Response Workflow",
				status: "running",
				steps: [
					{ name: "Detection", status: "completed", duration: 30 },
					{ name: "Analysis", status: "running", duration: 120 },
					{ name: "Containment", status: "pending", duration: 0 },
					{ name: "Recovery", status: "pending", duration: 0 },
					{ name: "Lessons Learned", status: "pending", duration: 0 },
				],
				triggeredBy: "Suspicious Login Detection",
				startedAt: new Date(Date.now() - 3 * 60 * 1000),
				estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000),
			},
			{
				id: "wf-2",
				name: "Compliance Audit Workflow",
				status: "completed",
				steps: [
					{ name: "Data Collection", status: "completed", duration: 300 },
					{ name: "Analysis", status: "completed", duration: 600 },
					{ name: "Report Generation", status: "completed", duration: 180 },
					{ name: "Review", status: "completed", duration: 240 },
				],
				triggeredBy: "Scheduled Audit",
				startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
				completedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
			},
		];

		const mockMetrics = {
			totalRules: 5,
			activeRules: 4,
			totalExecutions: 195,
			successRate: 0.91,
			avgResponseTime: 135, // seconds
			incidentsPrevented: 23,
			falsePositives: 12,
			automationCoverage: 0.87,
			workflows: {
				running: 1,
				completed: 1,
				failed: 0,
				pending: 0,
			},
		};

		setAutomationRules(mockRules);
		setActiveWorkflows(mockWorkflows);
		setAutomationMetrics(mockMetrics);
	}, []);

	const priorityConfig = {
		low: { color: "bg-blue-100 text-blue-800", icon: Clock },
		medium: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
		high: { color: "bg-orange-100 text-orange-800", icon: AlertTriangle },
		critical: { color: "bg-red-100 text-red-800", icon: XCircle },
	};

	const statusConfig = {
		running: { color: "bg-blue-100 text-blue-800", icon: Activity },
		completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
		failed: { color: "bg-red-100 text-red-800", icon: XCircle },
		pending: { color: "bg-gray-100 text-gray-800", icon: Clock },
	};

	const actionIcons = {
		send_alert: Mail,
		require_mfa: Shield,
		log_incident: MessageSquare,
		isolate_system: Shield,
		notify_compliance: Users,
		initiate_investigation: Activity,
		temporary_lockout: Lock,
		send_notification: Mail,
		log_security_event: MessageSquare,
		increase_monitoring: Eye,
		require_additional_verification: Shield,
		generate_report: FileText,
		notify_auditor: Users,
		create_remediation_task: CheckCircle,
	};

	const getSuccessRateColor = (rate: number) => {
		if (rate >= 0.9) return "text-green-600";
		if (rate >= 0.8) return "text-yellow-600";
		if (rate >= 0.7) return "text-orange-600";
		return "text-red-600";
	};

	const toggleRule = (ruleId: string) => {
		setAutomationRules((rules) =>
			rules.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule))
		);
	};

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center space-x-2">
						<Bot className="h-6 w-6" />
						<span>{t("securityAutomation.title")}</span>
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						{t("securityAutomation.subtitle")}
					</p>
				</div>
				<div className="flex items-center space-x-4">
					<Badge variant="outline" className="bg-green-50 text-green-700">
						<Activity className="h-3 w-3 mr-1" />
						{t("status.automated")}
					</Badge>
					<Button variant="outline" size="sm">
						<Settings className="h-4 w-4 mr-2" />
						{t("configure")}
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="workflows">{t("tabs.workflows")}</TabsTrigger>
					<TabsTrigger value="rules">{t("tabs.rules")}</TabsTrigger>
					<TabsTrigger value="performance">{t("tabs.performance")}</TabsTrigger>
					<TabsTrigger value="builder">{t("tabs.builder")}</TabsTrigger>
				</TabsList>

				<TabsContent value="workflows" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.activeWorkflows")}
										</p>
										<p className="text-2xl font-bold text-blue-600">
											{automationMetrics.workflows.running}
										</p>
									</div>
									<Workflow className="h-8 w-8 text-blue-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<span className="text-gray-500">
										{t("metrics.of")}{" "}
										{automationMetrics.workflows.running +
											automationMetrics.workflows.completed +
											automationMetrics.workflows.failed +
											automationMetrics.workflows.pending}{" "}
										{t("metrics.total")}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.successRate")}
										</p>
										<p className="text-2xl font-bold text-green-600">
											{(automationMetrics.successRate * 100).toFixed(1)}%
										</p>
									</div>
									<CheckCircle className="h-8 w-8 text-green-500" />
								</div>
								<div className="mt-4">
									<Progress
										value={automationMetrics.successRate * 100}
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
											{t("metrics.avgResponseTime")}
										</p>
										<p className="text-2xl font-bold">
											{automationMetrics.avgResponseTime}s
										</p>
									</div>
									<Timer className="h-8 w-8 text-orange-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<span className="text-green-600">-12%</span>
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
											{t("metrics.incidentsPrevented")}
										</p>
										<p className="text-2xl font-bold text-purple-600">
											{automationMetrics.incidentsPrevented}
										</p>
									</div>
									<Shield className="h-8 w-8 text-purple-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<span className="text-green-600">+8.5%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.vsLastMonth")}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("activeWorkflows.title")}</CardTitle>
							<CardDescription>{t("activeWorkflows.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								{activeWorkflows.map((workflow) => (
									<div key={workflow.id} className="border rounded-lg p-6">
										<div className="flex items-center justify-between mb-4">
											<div>
												<h3 className="text-lg font-medium">
													{workflow.name}
												</h3>
												<p className="text-sm text-gray-500">
													{t("activeWorkflows.triggeredBy")}:{" "}
													{workflow.triggeredBy}
												</p>
											</div>
											<div className="flex items-center space-x-2">
												<Badge
													className={
														statusConfig[
															workflow.status as keyof typeof statusConfig
														]?.color
													}
												>
													{workflow.status}
												</Badge>
												{workflow.status === "running" && (
													<Button variant="outline" size="sm">
														<Pause className="h-4 w-4 mr-2" />
														{t("pause")}
													</Button>
												)}
											</div>
										</div>

										<div className="space-y-3">
											{workflow.steps.map(
												(step: WorkflowStep, index: number) => {
													const StatusIcon =
														statusConfig[
															step.status as keyof typeof statusConfig
														]?.icon || Clock;
													return (
														<div
															key={index}
															className="flex items-center space-x-4"
														>
															<div
																className={`p-2 rounded-full ${
																	step.status === "completed"
																		? "bg-green-100"
																		: step.status === "running"
																			? "bg-blue-100"
																			: "bg-gray-100"
																}`}
															>
																<StatusIcon
																	className={`h-4 w-4 ${
																		step.status === "completed"
																			? "text-green-600"
																			: step.status ===
																					"running"
																				? "text-blue-600"
																				: "text-gray-400"
																	}`}
																/>
															</div>
															<div className="flex-1">
																<div className="flex items-center justify-between">
																	<span className="font-medium">
																		{step.name}
																	</span>
																	<span className="text-sm text-gray-500">
																		{step.duration > 0
																			? `${step.duration}s`
																			: ""}
																	</span>
																</div>
															</div>
															{index < workflow.steps.length - 1 && (
																<div className="w-px h-8 bg-gray-300" />
															)}
														</div>
													);
												}
											)}
										</div>

										<div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
											<span>
												{t("activeWorkflows.started")}:{" "}
												{workflow.startedAt.toLocaleString()}
											</span>
											{workflow.estimatedCompletion && (
												<span>
													{t("activeWorkflows.estimatedCompletion")}:{" "}
													{workflow.estimatedCompletion.toLocaleString()}
												</span>
											)}
											{workflow.completedAt && (
												<span>
													{t("activeWorkflows.completed")}:{" "}
													{workflow.completedAt.toLocaleString()}
												</span>
											)}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="rules" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("rules.title")}</CardTitle>
							<CardDescription>{t("rules.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("rules.table.name")}</TableHead>
										<TableHead>{t("rules.table.trigger")}</TableHead>
										<TableHead>{t("rules.table.actions")}</TableHead>
										<TableHead>{t("rules.table.priority")}</TableHead>
										<TableHead>{t("rules.table.successRate")}</TableHead>
										<TableHead>{t("rules.table.status")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{automationRules.map((rule) => {
										const PriorityIcon =
											priorityConfig[
												rule.priority as keyof typeof priorityConfig
											]?.icon || AlertTriangle;

										return (
											<TableRow key={rule.id}>
												<TableCell>
													<div>
														<div className="font-medium">
															{rule.name}
														</div>
														<div className="text-sm text-gray-500">
															{rule.description}
														</div>
													</div>
												</TableCell>
												<TableCell>
													<Badge variant="outline" className="text-xs">
														{rule.trigger.replace("_", " ")}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex flex-wrap gap-1">
														{rule.actions
															.slice(0, 2)
															.map((action: string) => {
																const ActionIcon =
																	actionIcons[
																		action as keyof typeof actionIcons
																	] || Activity;
																return (
																	<Badge
																		key={action}
																		variant="outline"
																		className="text-xs"
																	>
																		<ActionIcon className="h-3 w-3 mr-1" />
																		{action.replace("_", " ")}
																	</Badge>
																);
															})}
														{rule.actions.length > 2 && (
															<Badge
																variant="outline"
																className="text-xs"
															>
																+{rule.actions.length - 2}
															</Badge>
														)}
													</div>
												</TableCell>
												<TableCell>
													<Badge
														className={
															priorityConfig[
																rule.priority as keyof typeof priorityConfig
															]?.color
														}
													>
														<PriorityIcon className="h-3 w-3 mr-1" />
														{rule.priority}
													</Badge>
												</TableCell>
												<TableCell>
													<span
														className={`font-medium ${getSuccessRateColor(rule.successRate)}`}
													>
														{(rule.successRate * 100).toFixed(1)}%
													</span>
												</TableCell>
												<TableCell>
													<div className="flex items-center space-x-2">
														<Switch
															checked={rule.enabled}
															onCheckedChange={() =>
																toggleRule(rule.id)
															}
														/>
														<span className="text-sm">
															{rule.enabled
																? t("rules.status.enabled")
																: t("rules.status.disabled")}
														</span>
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

				<TabsContent value="performance" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("performance.coverage.title")}</CardTitle>
								<CardDescription>
									{t("performance.coverage.description")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">
											{t("performance.coverage.overall")}
										</span>
										<span className="text-sm font-medium">
											{(automationMetrics.automationCoverage * 100).toFixed(
												1
											)}
											%
										</span>
									</div>
									<Progress value={automationMetrics.automationCoverage * 100} />

									<div className="grid grid-cols-2 gap-4 pt-4">
										<div className="text-center p-3 bg-blue-50 rounded-lg">
											<div className="text-2xl font-bold text-blue-600">
												{automationMetrics.activeRules || 0}
											</div>
											<div className="text-sm text-gray-600">
												{t("performance.coverage.activeRules")}
											</div>
										</div>
										<div className="text-center p-3 bg-green-50 rounded-lg">
											<div className="text-2xl font-bold text-green-600">
												{automationMetrics.totalExecutions || 0}
											</div>
											<div className="text-sm text-gray-600">
												{t("performance.coverage.totalExecutions")}
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{t("performance.response.title")}</CardTitle>
								<CardDescription>
									{t("performance.response.description")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">
											{t("performance.response.average")}
										</span>
										<span className="text-sm font-medium">
											{automationMetrics.avgResponseTime}s
										</span>
									</div>

									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span>{t("performance.response.fastest")}</span>
											<span className="font-medium">15s</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span>{t("performance.response.slowest")}</span>
											<span className="font-medium">420s</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span>{t("performance.response.median")}</span>
											<span className="font-medium">95s</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("performance.effectiveness.title")}</CardTitle>
							<CardDescription>
								{t("performance.effectiveness.description")}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="text-center">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
										<CheckCircle className="h-8 w-8 text-green-600" />
									</div>
									<div className="text-2xl font-bold text-green-600">
										{automationMetrics.incidentsPrevented}
									</div>
									<div className="text-sm text-gray-600">
										{t("performance.effectiveness.incidentsPrevented")}
									</div>
								</div>

								<div className="text-center">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
										<AlertTriangle className="h-8 w-8 text-yellow-600" />
									</div>
									<div className="text-2xl font-bold text-yellow-600">
										{automationMetrics.falsePositives}
									</div>
									<div className="text-sm text-gray-600">
										{t("performance.effectiveness.falsePositives")}
									</div>
								</div>

								<div className="text-center">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
										<Activity className="h-8 w-8 text-blue-600" />
									</div>
									<div className="text-2xl font-bold text-blue-600">
										{(automationMetrics.successRate * 100).toFixed(1)}%
									</div>
									<div className="text-sm text-gray-600">
										{t("performance.effectiveness.accuracy")}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="builder" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>{t("builder.rule.title")}</CardTitle>
								<CardDescription>{t("builder.rule.description")}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="rule-name">{t("builder.rule.name")}</Label>
									<Input id="rule-name" placeholder="Enter rule name" />
								</div>

								<div className="space-y-2">
									<Label htmlFor="rule-trigger">
										{t("builder.rule.trigger")}
									</Label>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder="Select trigger event" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="login_anomaly">
												Login Anomaly
											</SelectItem>
											<SelectItem value="data_breach">
												Data Breach Detected
											</SelectItem>
											<SelectItem value="failed_logins">
												Multiple Failed Logins
											</SelectItem>
											<SelectItem value="risk_score_change">
												Risk Score Change
											</SelectItem>
											<SelectItem value="compliance_violation">
												Compliance Violation
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label>{t("builder.rule.actions")}</Label>
									<div className="space-y-2">
										{Object.keys(actionIcons).map((action) => (
											<div
												key={action}
												className="flex items-center space-x-2"
											>
												<input
													type="checkbox"
													id={action}
													className="rounded"
												/>
												<label
													htmlFor={action}
													className="text-sm capitalize"
												>
													{action.replace("_", " ")}
												</label>
											</div>
										))}
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="rule-description">
										{t("builder.rule.description")}
									</Label>
									<Textarea
										id="rule-description"
										placeholder="Describe the automation rule"
									/>
								</div>

								<Button className="w-full">
									<Zap className="h-4 w-4 mr-2" />
									{t("builder.rule.create")}
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{t("builder.workflow.title")}</CardTitle>
								<CardDescription>
									{t("builder.workflow.description")}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="workflow-name">
										{t("builder.workflow.name")}
									</Label>
									<Input id="workflow-name" placeholder="Enter workflow name" />
								</div>

								<div className="space-y-2">
									<Label>{t("builder.workflow.steps")}</Label>
									<div className="space-y-2">
										<div className="flex items-center space-x-2 p-2 border rounded">
											<span className="text-sm font-medium">1.</span>
											<Input placeholder="Step name" className="flex-1" />
											<Select>
												<SelectTrigger className="w-32">
													<SelectValue placeholder="Action" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="manual">Manual</SelectItem>
													<SelectItem value="automated">
														Automated
													</SelectItem>
													<SelectItem value="conditional">
														Conditional
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<Button variant="outline" size="sm">
											<GitBranch className="h-4 w-4 mr-2" />
											{t("builder.workflow.addStep")}
										</Button>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="workflow-trigger">
										{t("builder.workflow.trigger")}
									</Label>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder="Select trigger condition" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="scheduled">Scheduled</SelectItem>
											<SelectItem value="event">Event-based</SelectItem>
											<SelectItem value="manual">Manual</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<Button className="w-full">
									<Workflow className="h-4 w-4 mr-2" />
									{t("builder.workflow.create")}
								</Button>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("builder.templates.title")}</CardTitle>
							<CardDescription>{t("builder.templates.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
									<div className="flex items-center space-x-2 mb-2">
										<Shield className="h-5 w-5 text-blue-500" />
										<span className="font-medium">Incident Response</span>
									</div>
									<p className="text-sm text-gray-600">
										Automated incident detection and response workflow
									</p>
								</div>

								<div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
									<div className="flex items-center space-x-2 mb-2">
										<Users className="h-5 w-5 text-green-500" />
										<span className="font-medium">User Onboarding</span>
									</div>
									<p className="text-sm text-gray-600">
										Automated security checks for new user registration
									</p>
								</div>

								<div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
									<div className="flex items-center space-x-2 mb-2">
										<AlertTriangle className="h-5 w-5 text-orange-500" />
										<span className="font-medium">Compliance Monitoring</span>
									</div>
									<p className="text-sm text-gray-600">
										Continuous compliance checking and reporting
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
