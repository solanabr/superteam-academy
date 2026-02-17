/**
 * Anomaly Detection Component
 * Implements real-time anomaly detection with machine learning algorithms
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
	Zap,
	TrendingUp,
	TrendingDown,
	AlertTriangle,
	CheckCircle,
	Settings,
	BarChart3,
	Activity,
	Cpu,
	Shield,
	Bell,
	BellOff,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface DetectionRule {
	id: string;
	name: string;
	type: string;
	threshold: number;
	enabled: boolean;
	alerts: number;
	accuracy: number;
	falsePositiveRate: number;
	description: string;
}

interface ModelPerformance {
	precision: number;
	recall: number;
	f1Score: number;
}

interface AnomalyMetrics {
	totalAnomalies: number;
	activeAlerts: number;
	resolvedAlerts: number;
	falsePositives: number;
	detectionAccuracy: number;
	averageResponseTime: number;
	systemLoad: number;
	modelPerformance: ModelPerformance;
	anomalyTypes: Record<string, number>;
	severityDistribution: Record<string, number>;
}

const defaultAnomalyMetrics: AnomalyMetrics = {
	totalAnomalies: 0,
	activeAlerts: 0,
	resolvedAlerts: 0,
	falsePositives: 0,
	detectionAccuracy: 0,
	averageResponseTime: 0,
	systemLoad: 0,
	modelPerformance: { precision: 0, recall: 0, f1Score: 0 },
	anomalyTypes: {},
	severityDistribution: {},
};

interface AnomalyDetectionProps {
	className?: string;
}

export function AnomalyDetection({ className = "" }: AnomalyDetectionProps) {
	const t = useTranslations("anomaly");
	const [activeTab, setActiveTab] = useState("detection");
	const [detectionRules, setDetectionRules] = useState<DetectionRule[]>([]);
	const [anomalyMetrics, setAnomalyMetrics] = useState<AnomalyMetrics>(defaultAnomalyMetrics);
	const [alertsEnabled, setAlertsEnabled] = useState(true);
	const [sensitivity, setSensitivity] = useState(0.7);

	// Mock anomaly detection data
	useEffect(() => {
		const mockRules = [
			{
				id: "1",
				name: "Session Duration Anomaly",
				type: "statistical",
				threshold: 2.5, // standard deviations
				enabled: true,
				alerts: 12,
				accuracy: 0.94,
				falsePositiveRate: 0.03,
				description: "Detects unusually long or short session durations",
			},
			{
				id: "2",
				name: "Rapid Action Sequence",
				type: "behavioral",
				threshold: 0.85, // confidence score
				enabled: true,
				alerts: 8,
				accuracy: 0.89,
				falsePositiveRate: 0.07,
				description: "Identifies sequences of actions performed too quickly",
			},
			{
				id: "3",
				name: "Geographic Location Shift",
				type: "geospatial",
				threshold: 500, // km
				enabled: true,
				alerts: 15,
				accuracy: 0.91,
				falsePositiveRate: 0.04,
				description: "Flags logins from geographically distant locations",
			},
			{
				id: "4",
				name: "Device Fingerprint Change",
				type: "device",
				threshold: 0.75, // similarity score
				enabled: false,
				alerts: 0,
				accuracy: 0.96,
				falsePositiveRate: 0.02,
				description: "Detects changes in device characteristics",
			},
			{
				id: "5",
				name: "Time-based Pattern Deviation",
				type: "temporal",
				threshold: 3.0, // standard deviations
				enabled: true,
				alerts: 6,
				accuracy: 0.87,
				falsePositiveRate: 0.08,
				description: "Identifies deviations from normal time-based patterns",
			},
		];

		const mockMetrics = {
			totalAnomalies: 41,
			activeAlerts: 7,
			resolvedAlerts: 34,
			falsePositives: 3,
			detectionAccuracy: 0.92,
			averageResponseTime: 45, // seconds
			systemLoad: 0.34,
			modelPerformance: {
				precision: 0.89,
				recall: 0.94,
				f1Score: 0.91,
			},
			anomalyTypes: {
				statistical: 18,
				behavioral: 12,
				geospatial: 8,
				device: 3,
				temporal: 0,
			},
			severityDistribution: {
				low: 23,
				medium: 12,
				high: 5,
				critical: 1,
			},
		};

		setDetectionRules(mockRules);
		setAnomalyMetrics(mockMetrics);
	}, []);

	const ruleTypeConfig = {
		statistical: { icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
		behavioral: { icon: Activity, color: "text-green-600", bg: "bg-green-50" },
		geospatial: { icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
		device: { icon: Shield, color: "text-orange-600", bg: "bg-orange-50" },
		temporal: { icon: TrendingUp, color: "text-red-600", bg: "bg-red-50" },
	};

	const getAccuracyColor = (accuracy: number) => {
		if (accuracy >= 0.9) return "text-green-600";
		if (accuracy >= 0.8) return "text-yellow-600";
		return "text-red-600";
	};

	const getSeverityColor = (severity: string) => {
		const colors = {
			low: "bg-blue-100 text-blue-800",
			medium: "bg-yellow-100 text-yellow-800",
			high: "bg-orange-100 text-orange-800",
			critical: "bg-red-100 text-red-800",
		};
		return colors[severity as keyof typeof colors] || "bg-gray-100 text-gray-800";
	};

	const toggleRule = (ruleId: string) => {
		setDetectionRules((rules) =>
			rules.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule))
		);
	};

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center space-x-2">
						<Zap className="h-6 w-6" />
						<span>{t("anomalyDetection.title")}</span>
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						{t("anomalyDetection.subtitle")}
					</p>
				</div>
				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-2">
						<Switch
							id="alerts"
							checked={alertsEnabled}
							onCheckedChange={setAlertsEnabled}
						/>
						<Label htmlFor="alerts" className="text-sm">
							{alertsEnabled ? (
								<span className="flex items-center space-x-1">
									<Bell className="h-3 w-3" />
									<span>{t("alerts.enabled")}</span>
								</span>
							) : (
								<span className="flex items-center space-x-1">
									<BellOff className="h-3 w-3" />
									<span>{t("alerts.disabled")}</span>
								</span>
							)}
						</Label>
					</div>
					<Badge variant="outline" className="bg-green-50 text-green-700">
						<Activity className="h-3 w-3 mr-1" />
						{t("status.active")}
					</Badge>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="detection">{t("tabs.detection")}</TabsTrigger>
					<TabsTrigger value="rules">{t("tabs.rules")}</TabsTrigger>
					<TabsTrigger value="performance">{t("tabs.performance")}</TabsTrigger>
					<TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>
				</TabsList>

				<TabsContent value="detection" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.totalAnomalies")}
										</p>
										<p className="text-2xl font-bold text-orange-600">
											{anomalyMetrics.totalAnomalies || 0}
										</p>
									</div>
									<AlertTriangle className="h-8 w-8 text-orange-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-red-500 mr-1" />
									<span className="text-red-600">+15%</span>
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
											{t("metrics.activeAlerts")}
										</p>
										<p className="text-2xl font-bold text-red-600">
											{anomalyMetrics.activeAlerts || 0}
										</p>
									</div>
									<Bell className="h-8 w-8 text-red-500" />
								</div>
								<div className="mt-4">
									<Progress
										value={
											((anomalyMetrics.activeAlerts || 0) /
												(anomalyMetrics.totalAnomalies || 1)) *
											100
										}
										className="h-2"
									/>
									<p className="text-xs text-gray-500 mt-1">
										{t("metrics.requiresAttention")}
									</p>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.detectionAccuracy")}
										</p>
										<p className="text-2xl font-bold text-green-600">
											{(
												(anomalyMetrics.detectionAccuracy || 0) * 100
											).toFixed(1)}
											%
										</p>
									</div>
									<CheckCircle className="h-8 w-8 text-green-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">+2.1%</span>
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
											{t("metrics.responseTime")}
										</p>
										<p className="text-2xl font-bold">
											{anomalyMetrics.averageResponseTime || 0}s
										</p>
									</div>
									<Activity className="h-8 w-8 text-blue-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingDown className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">-8%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.optimization")}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("anomalyTypes.title")}</CardTitle>
							<CardDescription>{t("anomalyTypes.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
								{Object.entries(anomalyMetrics.anomalyTypes || {}).map(
									([type, count]) => {
										const config =
											ruleTypeConfig[type as keyof typeof ruleTypeConfig];
										const Icon = config?.icon || BarChart3;

										return (
											<div key={type} className="p-4 border rounded-lg">
												<div className="flex items-center justify-between mb-2">
													<Icon
														className={`h-5 w-5 ${config?.color || "text-gray-600"}`}
													/>
													<span className="text-sm font-medium capitalize">
														{type}
													</span>
												</div>
												<div className="text-2xl font-bold">
													{count as number}
												</div>
												<div className="w-full bg-gray-200 rounded-full h-2 mt-2">
													<div
														className={`h-2 rounded-full ${config?.bg || "bg-gray-500"}`}
														style={{
															width: `${((count as number) / (anomalyMetrics.totalAnomalies || 1)) * 100}%`,
														}}
													/>
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
							<CardTitle>{t("severityDistribution.title")}</CardTitle>
							<CardDescription>
								{t("severityDistribution.description")}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{Object.entries(anomalyMetrics.severityDistribution || {}).map(
									([severity, count]) => (
										<div
											key={severity}
											className="flex items-center justify-between"
										>
											<div className="flex items-center space-x-3">
												<Badge
													className={`capitalize ${getSeverityColor(severity)}`}
												>
													{severity}
												</Badge>
												<span className="text-sm">
													{count as number}{" "}
													{t("severityDistribution.anomalies")}
												</span>
											</div>
											<div className="flex items-center space-x-2">
												<div className="w-32 bg-gray-200 rounded-full h-2">
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
															width: `${((count as number) / (anomalyMetrics.totalAnomalies || 1)) * 100}%`,
														}}
													/>
												</div>
												<span className="text-sm font-medium w-8 text-right">
													{(
														((count as number) /
															(anomalyMetrics.totalAnomalies || 1)) *
														100
													).toFixed(0)}
													%
												</span>
											</div>
										</div>
									)
								)}
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
										<TableHead>{t("rules.table.type")}</TableHead>
										<TableHead>{t("rules.table.threshold")}</TableHead>
										<TableHead>{t("rules.table.accuracy")}</TableHead>
										<TableHead>{t("rules.table.alerts")}</TableHead>
										<TableHead>{t("rules.table.status")}</TableHead>
										<TableHead>{t("rules.table.actions")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{detectionRules.map((rule) => {
										const config =
											ruleTypeConfig[
												rule.type as keyof typeof ruleTypeConfig
											];
										const Icon = config?.icon || BarChart3;

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
													<div className="flex items-center space-x-2">
														<Icon
															className={`h-4 w-4 ${config?.color || "text-gray-600"}`}
														/>
														<span className="text-sm capitalize">
															{rule.type}
														</span>
													</div>
												</TableCell>
												<TableCell className="font-mono text-sm">
													{typeof rule.threshold === "number" &&
													rule.threshold < 1
														? `${(rule.threshold * 100).toFixed(0)}%`
														: rule.threshold}
												</TableCell>
												<TableCell>
													<span
														className={`font-medium ${getAccuracyColor(rule.accuracy)}`}
													>
														{(rule.accuracy * 100).toFixed(1)}%
													</span>
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={
															rule.alerts > 0
																? "text-orange-600"
																: "text-gray-600"
														}
													>
														{rule.alerts}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														variant={
															rule.enabled ? "default" : "secondary"
														}
													>
														{rule.enabled
															? t("rules.status.enabled")
															: t("rules.status.disabled")}
													</Badge>
												</TableCell>
												<TableCell>
													<Button
														variant="outline"
														size="sm"
														onClick={() => toggleRule(rule.id)}
													>
														{rule.enabled
															? t("rules.actions.disable")
															: t("rules.actions.enable")}
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

				<TabsContent value="performance" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Cpu className="h-5 w-5" />
									<span>{t("performance.model.title")}</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{Object.entries(anomalyMetrics.modelPerformance || {}).map(
										([metric, value]) => (
											<div
												key={metric}
												className="flex items-center justify-between"
											>
												<span className="text-sm font-medium capitalize">
													{metric.replace(/([A-Z])/g, " $1").trim()}
												</span>
												<div className="flex items-center space-x-2">
													<div className="w-24 bg-gray-200 rounded-full h-2">
														<div
															className="bg-blue-600 h-2 rounded-full"
															style={{
																width: `${(value as number) * 100}%`,
															}}
														/>
													</div>
													<span className="text-sm font-medium w-12 text-right">
														{((value as number) * 100).toFixed(1)}%
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
								<CardTitle className="flex items-center space-x-2">
									<Activity className="h-5 w-5" />
									<span>{t("performance.system.title")}</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">
											{t("performance.system.load")}
										</span>
										<span className="text-sm font-medium">
											{(anomalyMetrics.systemLoad * 100).toFixed(1)}%
										</span>
									</div>
									<Progress
										value={anomalyMetrics.systemLoad * 100}
										className="h-3"
									/>

									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">
											{t("performance.system.memory")}
										</span>
										<span className="text-sm font-medium">67%</span>
									</div>
									<Progress value={67} className="h-3" />

									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">
											{t("performance.system.cpu")}
										</span>
										<span className="text-sm font-medium">34%</span>
									</div>
									<Progress value={34} className="h-3" />
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("performance.alerts.title")}</CardTitle>
							<CardDescription>{t("performance.alerts.description")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Alert>
								<CheckCircle className="h-4 w-4" />
								<AlertDescription>
									<strong>{t("performance.alerts.accuracy.title")}</strong>{" "}
									{t("performance.alerts.accuracy.description")}
								</AlertDescription>
							</Alert>

							<Alert>
								<TrendingDown className="h-4 w-4" />
								<AlertDescription>
									<strong>{t("performance.alerts.response.title")}</strong>{" "}
									{t("performance.alerts.response.description")}
								</AlertDescription>
							</Alert>

							<Alert>
								<Activity className="h-4 w-4" />
								<AlertDescription>
									<strong>{t("performance.alerts.load.title")}</strong>{" "}
									{t("performance.alerts.load.description")}
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="settings" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Settings className="h-5 w-5" />
								<span>{t("settings.title")}</span>
							</CardTitle>
							<CardDescription>{t("settings.description")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="alerts-global">
											{t("settings.alerts.title")}
										</Label>
										<p className="text-sm text-gray-500">
											{t("settings.alerts.description")}
										</p>
									</div>
									<Switch
										id="alerts-global"
										checked={alertsEnabled}
										onCheckedChange={setAlertsEnabled}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="sensitivity">
										{t("settings.sensitivity.title")}
									</Label>
									<div className="flex items-center space-x-4">
										<Input
											id="sensitivity"
											type="range"
											min="0.1"
											max="0.9"
											step="0.1"
											value={sensitivity}
											onChange={(e) =>
												setSensitivity(parseFloat(e.target.value))
											}
											className="flex-1"
										/>
										<span className="text-sm font-medium w-12 text-right">
											{(sensitivity * 100).toFixed(0)}%
										</span>
									</div>
									<p className="text-sm text-gray-500">
										{t("settings.sensitivity.description")}
									</p>
								</div>
							</div>

							<div className="border-t pt-6">
								<h3 className="text-lg font-medium mb-4">
									{t("settings.rules.title")}
								</h3>
								<div className="space-y-4">
									{detectionRules.map((rule) => (
										<div
											key={rule.id}
											className="flex items-center justify-between p-4 border rounded-lg"
										>
											<div className="flex-1">
												<div className="flex items-center space-x-3">
													<Switch
														checked={rule.enabled}
														onCheckedChange={() => toggleRule(rule.id)}
													/>
													<div>
														<div className="font-medium">
															{rule.name}
														</div>
														<div className="text-sm text-gray-500">
															{rule.description}
														</div>
													</div>
												</div>
											</div>
											<div className="text-right">
												<div className="text-sm text-gray-500">
													{t("settings.rules.alerts")}: {rule.alerts}
												</div>
												<div
													className={`text-sm font-medium ${getAccuracyColor(rule.accuracy)}`}
												>
													{(rule.accuracy * 100).toFixed(1)}%{" "}
													{t("settings.rules.accuracy")}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
