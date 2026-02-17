/**
 * Fraud Prevention Systems Component
 * Implements comprehensive fraud detection and prevention mechanisms
 */

"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Shield,
	AlertTriangle,
	CheckCircle,
	DollarSign,
	TrendingUp,
	Eye,
	Flag,
	Ban,
	Search,
} from "lucide-react";
import { useTranslations } from "next-intl";

type ActivityStatus = "flagged" | "investigating" | "blocked" | "resolved";
type RiskLevel = "low" | "medium" | "high" | "critical";

interface SuspiciousActivity {
	id: string;
	type: string;
	risk: RiskLevel;
	amount: number;
	user: string;
	location: string;
	device: string;
	timestamp: Date;
	status: ActivityStatus;
	reason: string;
}

interface FraudMetrics {
	totalFlagged: number;
	blockedTransactions: number;
	preventedLoss: number;
	falsePositives: number;
	detectionAccuracy: number;
	averageResponseTime: number;
	fraudByType: Record<string, number>;
	riskDistribution: Partial<Record<RiskLevel, number>>;
}

interface FraudPreventionProps {
	className?: string;
}

export function FraudPrevention({ className = "" }: FraudPreventionProps) {
	const t = useTranslations("fraud");
	const [activeTab, setActiveTab] = useState("overview");
	const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
	const [fraudMetrics, setFraudMetrics] = useState<FraudMetrics | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Mock fraud prevention data
	useEffect(() => {
		const mockActivities: SuspiciousActivity[] = [
			{
				id: "1",
				type: "suspicious_transaction",
				risk: "high",
				amount: 999.99,
				user: "user_12345",
				location: "Unknown",
				device: "Unusual Device",
				timestamp: new Date(Date.now() - 10 * 60 * 1000),
				status: "flagged",
				reason: "Transaction from high-risk location",
			},
			{
				id: "2",
				type: "account_takeover",
				risk: "critical",
				amount: 0,
				user: "user_67890",
				location: "New York, US",
				device: "New Device",
				timestamp: new Date(Date.now() - 25 * 60 * 1000),
				status: "blocked",
				reason: "Login from unrecognized device after password change",
			},
			{
				id: "3",
				type: "chargeback_fraud",
				risk: "medium",
				amount: 299.99,
				user: "user_54321",
				location: "London, UK",
				device: "Mobile App",
				timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
				status: "investigating",
				reason: "Multiple chargebacks from same user",
			},
			{
				id: "4",
				type: "identity_theft",
				risk: "high",
				amount: 149.99,
				user: "user_98765",
				location: "Tokyo, JP",
				device: "Desktop Browser",
				timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
				status: "resolved",
				reason: "Mismatched identity verification data",
			},
		];

		const mockMetrics = {
			totalFlagged: 156,
			blockedTransactions: 89,
			preventedLoss: 45_678.9,
			falsePositives: 23,
			detectionAccuracy: 94.2,
			averageResponseTime: 2.3, // minutes
			fraudByType: {
				suspicious_transaction: 45,
				account_takeover: 28,
				chargeback_fraud: 34,
				identity_theft: 22,
				payment_fraud: 18,
				bonus_abuse: 9,
			},
			riskDistribution: {
				low: 67,
				medium: 45,
				high: 32,
				critical: 12,
			},
		};

		setSuspiciousActivities(mockActivities);
		setFraudMetrics(mockMetrics);
	}, []);

	const riskConfig = {
		low: {
			color: "bg-blue-500",
			text: "text-blue-700",
			bg: "bg-blue-50",
			border: "border-blue-200",
		},
		medium: {
			color: "bg-yellow-500",
			text: "text-yellow-700",
			bg: "bg-yellow-50",
			border: "border-yellow-200",
		},
		high: {
			color: "bg-orange-500",
			text: "text-orange-700",
			bg: "bg-orange-50",
			border: "border-orange-200",
		},
		critical: {
			color: "bg-red-500",
			text: "text-red-700",
			bg: "bg-red-50",
			border: "border-red-200",
		},
	};

	const statusConfig = {
		flagged: { icon: Flag, color: "text-yellow-600", bg: "bg-yellow-50" },
		investigating: { icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
		blocked: { icon: Ban, color: "text-red-600", bg: "bg-red-50" },
		resolved: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
	};

	const filteredActivities = useMemo(() => {
		return suspiciousActivities.filter((activity) => {
			const matchesSearch =
				activity.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
				activity.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
				activity.type.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesStatus = statusFilter === "all" || activity.status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [suspiciousActivities, searchQuery, statusFilter]);

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center space-x-2">
						<Shield className="h-6 w-6" />
						<span>{t("fraudPrevention.title")}</span>
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						{t("fraudPrevention.subtitle")}
					</p>
				</div>
				<div className="flex items-center space-x-4">
					<Badge variant="outline" className="bg-green-50 text-green-700">
						<CheckCircle className="h-3 w-3 mr-1" />
						{t("status.active")}
					</Badge>
					<Badge variant="secondary">
						{t("accuracy")}: {fraudMetrics?.detectionAccuracy ?? 0}%
					</Badge>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
					<TabsTrigger value="activities">{t("tabs.activities")}</TabsTrigger>
					<TabsTrigger value="analytics">{t("tabs.analytics")}</TabsTrigger>
					<TabsTrigger value="rules">{t("tabs.rules")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.preventedLoss")}
										</p>
										<p className="text-2xl font-bold text-green-600">
											${fraudMetrics?.preventedLoss?.toLocaleString() ?? 0}
										</p>
									</div>
									<DollarSign className="h-8 w-8 text-green-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">+15%</span>
									<span className="text-gray-500 ml-1">
										{t("metrics.thisMonth")}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{t("metrics.blockedTransactions")}
										</p>
										<p className="text-2xl font-bold text-red-600">
											{fraudMetrics?.blockedTransactions ?? 0}
										</p>
									</div>
									<Ban className="h-8 w-8 text-red-500" />
								</div>
								<div className="mt-4">
									<Progress
										value={
											((fraudMetrics?.blockedTransactions ?? 0) /
												(fraudMetrics?.totalFlagged || 1)) *
											100
										}
										className="h-2"
									/>
									<p className="text-xs text-gray-500 mt-1">
										{Math.round(
											((fraudMetrics?.blockedTransactions ?? 0) /
												(fraudMetrics?.totalFlagged || 1)) *
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
											{t("metrics.detectionAccuracy")}
										</p>
										<p className="text-2xl font-bold">
											{fraudMetrics?.detectionAccuracy ?? 0}%
										</p>
									</div>
									<CheckCircle className="h-8 w-8 text-blue-500" />
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
											{fraudMetrics?.averageResponseTime ?? 0}m
										</p>
									</div>
									<AlertTriangle className="h-8 w-8 text-orange-500" />
								</div>
								<div className="mt-4 flex items-center text-sm">
									<CheckCircle className="h-4 w-4 text-green-500 mr-1" />
									<span className="text-green-600">
										{t("metrics.withinLimits")}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<AlertTriangle className="h-5 w-5" />
								<span>{t("recentActivities.title")}</span>
							</CardTitle>
							<CardDescription>{t("recentActivities.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{suspiciousActivities.slice(0, 3).map((activity) => {
									const StatusIcon =
										statusConfig[activity.status]?.icon || AlertTriangle;
									const riskStyle = riskConfig[activity.risk];
									return (
										<div
											key={activity.id}
											className={`flex items-center justify-between p-4 border rounded-lg ${riskStyle?.border}`}
										>
											<div className="flex items-center space-x-4">
												<div
													className={`p-2 rounded-full ${statusConfig[activity.status]?.bg || "bg-gray-50"}`}
												>
													<StatusIcon
														className={`h-4 w-4 ${statusConfig[activity.status]?.color || "text-gray-600"}`}
													/>
												</div>
												<div>
													<div className="flex items-center space-x-2">
														<span className="font-medium">
															{activity.reason}
														</span>
														<Badge
															className={`${riskStyle?.bg} ${riskStyle?.text} text-xs`}
														>
															{activity.risk} {t("risk")}
														</Badge>
													</div>
													<div className="text-sm text-gray-500">
														{activity.user} • {activity.location} •{" "}
														{activity.device}
														{activity.amount > 0 &&
															` • $${activity.amount}`}
													</div>
												</div>
											</div>
											<div className="text-right">
												<div className="text-sm text-gray-500">
													{activity.timestamp.toLocaleTimeString()}
												</div>
												<Badge variant="outline" className="text-xs">
													{activity.status}
												</Badge>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="activities" className="space-y-6">
					<Card>
						<CardContent className="p-6">
							<div className="flex flex-col lg:flex-row gap-4">
								<div className="flex-1">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
										<Input
											placeholder={t("search.placeholder")}
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="pl-10"
										/>
									</div>
								</div>

								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="w-48">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											{t("filters.allStatuses")}
										</SelectItem>
										<SelectItem value="flagged">
											{t("filters.flagged")}
										</SelectItem>
										<SelectItem value="investigating">
											{t("filters.investigating")}
										</SelectItem>
										<SelectItem value="blocked">
											{t("filters.blocked")}
										</SelectItem>
										<SelectItem value="resolved">
											{t("filters.resolved")}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{t("activities.title")}</CardTitle>
							<CardDescription>{t("activities.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("activities.table.type")}</TableHead>
										<TableHead>{t("activities.table.risk")}</TableHead>
										<TableHead>{t("activities.table.user")}</TableHead>
										<TableHead>{t("activities.table.amount")}</TableHead>
										<TableHead>{t("activities.table.status")}</TableHead>
										<TableHead>{t("activities.table.time")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredActivities.map((activity) => {
										const StatusIcon =
											statusConfig[activity.status]?.icon || AlertTriangle;
										const riskStyle = riskConfig[activity.risk];
										return (
											<TableRow key={activity.id}>
												<TableCell className="font-medium">
													{activity.type.replace("_", " ")}
												</TableCell>
												<TableCell>
													<Badge
														className={`${riskStyle?.bg} ${riskStyle?.text} text-xs`}
													>
														{activity.risk}
													</Badge>
												</TableCell>
												<TableCell className="font-mono text-sm">
													{activity.user}
												</TableCell>
												<TableCell>
													{activity.amount > 0
														? `$${activity.amount}`
														: "-"}
												</TableCell>
												<TableCell>
													<div className="flex items-center space-x-2">
														<StatusIcon
															className={`h-4 w-4 ${statusConfig[activity.status]?.color || "text-gray-600"}`}
														/>
														<span className="text-sm">
															{activity.status}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-sm text-gray-500">
													{activity.timestamp.toLocaleString()}
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
								<CardTitle>{t("analytics.fraudByType")}</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{Object.entries(fraudMetrics?.fraudByType ?? {}).map(
										([type, count]) => (
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
															className="bg-red-600 h-2 rounded-full"
															style={{
																width: `${(count / Math.max(...Object.values(fraudMetrics?.fraudByType ?? {}))) * 100}%`,
															}}
														/>
													</div>
													<span className="text-sm font-medium w-8 text-right">
														{count}
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
								<CardTitle>{t("analytics.riskDistribution")}</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{Object.entries(fraudMetrics?.riskDistribution ?? {}).map(
										([risk, count]) => {
											const riskStyle = riskConfig[risk as RiskLevel];
											return (
												<div
													key={risk}
													className="flex items-center justify-between"
												>
													<div className="flex items-center space-x-2">
														<div
															className={`w-3 h-3 rounded-full ${riskStyle?.color}`}
														/>
														<span className="text-sm capitalize">
															{risk}
														</span>
													</div>
													<div className="flex items-center space-x-2">
														<div className="w-24 bg-gray-200 rounded-full h-2">
															<div
																className={`h-2 rounded-full ${riskStyle?.color}`}
																style={{
																	width: `${(count / Math.max(...Object.values(fraudMetrics?.riskDistribution ?? {}))) * 100}%`,
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

				<TabsContent value="rules" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("rules.title")}</CardTitle>
							<CardDescription>{t("rules.description")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
									<h4 className="font-medium">{t("rules.detectionRules")}</h4>
									<div className="space-y-3">
										<div className="flex items-center justify-between p-3 border rounded-lg">
											<div>
												<div className="font-medium text-sm">
													{t("rules.velocityChecks")}
												</div>
												<div className="text-xs text-gray-500">
													{t("rules.velocityDesc")}
												</div>
											</div>
											<Badge variant="secondary">{t("rules.enabled")}</Badge>
										</div>
										<div className="flex items-center justify-between p-3 border rounded-lg">
											<div>
												<div className="font-medium text-sm">
													{t("rules.deviceFingerprinting")}
												</div>
												<div className="text-xs text-gray-500">
													{t("rules.deviceDesc")}
												</div>
											</div>
											<Badge variant="secondary">{t("rules.enabled")}</Badge>
										</div>
										<div className="flex items-center justify-between p-3 border rounded-lg">
											<div>
												<div className="font-medium text-sm">
													{t("rules.locationAnalysis")}
												</div>
												<div className="text-xs text-gray-500">
													{t("rules.locationDesc")}
												</div>
											</div>
											<Badge variant="secondary">{t("rules.enabled")}</Badge>
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<h4 className="font-medium">{t("rules.thresholds")}</h4>
									<div className="space-y-3">
										<div className="space-y-2">
											<Label className="text-sm">
												{t("rules.maxTransactions")}
											</Label>
											<Input
												type="number"
												defaultValue="10"
												className="text-sm"
											/>
										</div>
										<div className="space-y-2">
											<Label className="text-sm">
												{t("rules.maxAmount")}
											</Label>
											<Input
												type="number"
												defaultValue="1000"
												className="text-sm"
											/>
										</div>
										<div className="space-y-2">
											<Label className="text-sm">
												{t("rules.riskScore")}
											</Label>
											<Input
												type="number"
												defaultValue="75"
												className="text-sm"
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="pt-6 border-t">
								<Button>
									<Shield className="h-4 w-4 mr-2" />
									{t("rules.saveChanges")}
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
