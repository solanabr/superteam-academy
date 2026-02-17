import { useState, useEffect, useCallback } from "react";
import { Smartphone, BarChart3, TrendingUp, Users, Clock, MapPin, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface MobileAnalyticsData {
	pageViews: number;
	uniqueVisitors: number;
	bounceRate: number;
	sessionDuration: number;
	deviceBreakdown: {
		mobile: number;
		tablet: number;
		desktop: number;
	};
	topPages: Array<{
		path: string;
		views: number;
		bounceRate: number;
	}>;
	userJourney: Array<{
		step: string;
		users: number;
		dropoff: number;
	}>;
	performance: {
		loadTime: number;
		interactionTime: number;
		scrollDepth: number;
	};
	geolocation: Array<{
		country: string;
		users: number;
	}>;
}

interface MobileAnalyticsProps {
	className?: string;
	enableTracking?: boolean;
	onDataUpdate?: (data: MobileAnalyticsData) => void;
}

export function MobileAnalytics({
	className,
	enableTracking = true,
	onDataUpdate,
}: MobileAnalyticsProps) {
	const t = useTranslations("analytics");
	const { toast } = useToast();

	const [data, setData] = useState<MobileAnalyticsData>({
		pageViews: 0,
		uniqueVisitors: 0,
		bounceRate: 0,
		sessionDuration: 0,
		deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0 },
		topPages: [],
		userJourney: [],
		performance: { loadTime: 0, interactionTime: 0, scrollDepth: 0 },
		geolocation: [],
	});

	const [isTracking, _setIsTracking] = useState(enableTracking);
	const [realTimeUpdates, setRealTimeUpdates] = useState(false);

	// Mock data generation for demonstration
	const generateMockData = useCallback((): MobileAnalyticsData => {
		return {
			pageViews: Math.floor(Math.random() * 10_000) + 5000,
			uniqueVisitors: Math.floor(Math.random() * 5000) + 2000,
			bounceRate: Math.floor(Math.random() * 30) + 20,
			sessionDuration: Math.floor(Math.random() * 300) + 120,
			deviceBreakdown: {
				mobile: Math.floor(Math.random() * 60) + 40,
				tablet: Math.floor(Math.random() * 20) + 10,
				desktop: Math.floor(Math.random() * 30) + 20,
			},
			topPages: [
				{
					path: "/courses",
					views: Math.floor(Math.random() * 2000) + 1000,
					bounceRate: Math.floor(Math.random() * 20) + 10,
				},
				{
					path: "/challenges",
					views: Math.floor(Math.random() * 1500) + 800,
					bounceRate: Math.floor(Math.random() * 25) + 15,
				},
				{
					path: "/leaderboard",
					views: Math.floor(Math.random() * 1000) + 500,
					bounceRate: Math.floor(Math.random() * 30) + 20,
				},
				{
					path: "/profile",
					views: Math.floor(Math.random() * 800) + 400,
					bounceRate: Math.floor(Math.random() * 35) + 25,
				},
			],
			userJourney: [
				{ step: "Landing", users: 1000, dropoff: 0 },
				{ step: "Course Discovery", users: 800, dropoff: 20 },
				{ step: "Course Enrollment", users: 600, dropoff: 25 },
				{ step: "First Lesson", users: 450, dropoff: 25 },
				{ step: "Completion", users: 300, dropoff: 33 },
			],
			performance: {
				loadTime: Math.floor(Math.random() * 2000) + 500,
				interactionTime: Math.floor(Math.random() * 1000) + 200,
				scrollDepth: Math.floor(Math.random() * 80) + 60,
			},
			geolocation: [
				{ country: "Brazil", users: Math.floor(Math.random() * 1000) + 500 },
				{ country: "United States", users: Math.floor(Math.random() * 800) + 300 },
				{ country: "India", users: Math.floor(Math.random() * 600) + 200 },
				{ country: "Spain", users: Math.floor(Math.random() * 400) + 100 },
			],
		};
	}, []);

	const updateAnalytics = useCallback(() => {
		if (!isTracking) return;

		const newData = generateMockData();
		setData(newData);
		onDataUpdate?.(newData);
	}, [isTracking, generateMockData, onDataUpdate]);

	const exportData = useCallback(() => {
		const dataStr = JSON.stringify(data, null, 2);
		const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

		const exportFileDefaultName = `mobile-analytics-${new Date().toISOString().split("T")[0]}.json`;

		const linkElement = document.createElement("a");
		linkElement.setAttribute("href", dataUri);
		linkElement.setAttribute("download", exportFileDefaultName);
		linkElement.click();

		toast({
			title: t("dataExported"),
			description: t("dataExportedDescription"),
		});
	}, [data, toast, t]);

	useEffect(() => {
		updateAnalytics();

		if (realTimeUpdates) {
			const interval = setInterval(updateAnalytics, 30_000); // Update every 30 seconds
			return () => clearInterval(interval);
		}
		return undefined;
	}, [updateAnalytics, realTimeUpdates]);

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const formatPercentage = (value: number) => `${value}%`;

	return (
		<div className={cn("space-y-4", className)}>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						{t("mobileAnalytics")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<span className="text-sm">{t("enableTracking")}</span>
						<Badge variant={isTracking ? "default" : "secondary"}>
							{isTracking ? t("enabled") : t("disabled")}
						</Badge>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-sm">{t("realTimeUpdates")}</span>
						<Button
							variant={realTimeUpdates ? "default" : "outline"}
							size="sm"
							onClick={() => setRealTimeUpdates(!realTimeUpdates)}
							disabled={!isTracking}
						>
							{realTimeUpdates ? t("on") : t("off")}
						</Button>
					</div>

					<div className="flex gap-2">
						<Button onClick={updateAnalytics} disabled={!isTracking} className="flex-1">
							{t("refreshData")}
						</Button>
						<Button variant="outline" onClick={exportData}>
							{t("exportData")}
						</Button>
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Eye className="h-4 w-4 text-blue-500" />
							<div>
								<p className="text-2xl font-bold">
									{data.pageViews.toLocaleString()}
								</p>
								<p className="text-xs text-muted-foreground">{t("pageViews")}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Users className="h-4 w-4 text-green-500" />
							<div>
								<p className="text-2xl font-bold">
									{data.uniqueVisitors.toLocaleString()}
								</p>
								<p className="text-xs text-muted-foreground">
									{t("uniqueVisitors")}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<TrendingUp className="h-4 w-4 text-orange-500" />
							<div>
								<p className="text-2xl font-bold">
									{formatPercentage(data.bounceRate)}
								</p>
								<p className="text-xs text-muted-foreground">{t("bounceRate")}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4 text-purple-500" />
							<div>
								<p className="text-2xl font-bold">
									{formatDuration(data.sessionDuration)}
								</p>
								<p className="text-xs text-muted-foreground">{t("avgSession")}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Smartphone className="h-5 w-5" />
						{t("deviceBreakdown")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm">{t("mobile")}</span>
							<span className="text-sm font-medium">
								{formatPercentage(data.deviceBreakdown.mobile)}
							</span>
						</div>
						<Progress value={data.deviceBreakdown.mobile} className="h-2" />
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm">{t("tablet")}</span>
							<span className="text-sm font-medium">
								{formatPercentage(data.deviceBreakdown.tablet)}
							</span>
						</div>
						<Progress value={data.deviceBreakdown.tablet} className="h-2" />
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm">{t("desktop")}</span>
							<span className="text-sm font-medium">
								{formatPercentage(data.deviceBreakdown.desktop)}
							</span>
						</div>
						<Progress value={data.deviceBreakdown.desktop} className="h-2" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("topPages")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{data.topPages.map((page, index) => (
							<div key={page.path} className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Badge variant="outline">{index + 1}</Badge>
									<span className="text-sm font-medium">{page.path}</span>
								</div>
								<div className="flex items-center gap-4 text-sm text-muted-foreground">
									<span>{page.views} views</span>
									<span>{formatPercentage(page.bounceRate)} bounce</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("performance")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-3 gap-4">
						<div className="text-center">
							<p className="text-2xl font-bold">{data.performance.loadTime}ms</p>
							<p className="text-xs text-muted-foreground">{t("loadTime")}</p>
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold">
								{data.performance.interactionTime}ms
							</p>
							<p className="text-xs text-muted-foreground">{t("interactionTime")}</p>
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold">
								{formatPercentage(data.performance.scrollDepth)}
							</p>
							<p className="text-xs text-muted-foreground">{t("scrollDepth")}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MapPin className="h-5 w-5" />
						{t("geolocation")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{data.geolocation.map((location) => (
							<div
								key={location.country}
								className="flex items-center justify-between"
							>
								<span className="text-sm font-medium">{location.country}</span>
								<Badge variant="secondary">{location.users} users</Badge>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
