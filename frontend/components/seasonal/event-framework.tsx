/**
 * Seasonal Event Framework Component
 * Manages seasonal events, themed content, and time-limited challenges
 */

"use client";

import { useState } from "react";
import { useSeasonalEvents } from "@/hooks/use-seasonal-events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertTriangle,
    Calendar,
    Clock,
    Trophy,
    Gift,
    Star,
    Flame,
    Snowflake,
    Sun,
    Target,
    Users,
    Award,
    Timer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { format, differenceInDays, differenceInHours } from "date-fns";

interface SeasonalEventFrameworkProps {
	userId: string;
	className?: string;
}

export function SeasonalEventFramework({ userId, className = "" }: SeasonalEventFrameworkProps) {
	const t = useTranslations("seasonal");
	const {
		currentEvent,
		upcomingEvents,
		userProgress,
		challenges,
		rewards,
		loading,
		error,
		joinEvent,
		completeChallenge,
		claimReward,
	} = useSeasonalEvents(userId);

	const [activeTab, setActiveTab] = useState("current");

	if (loading) {
		return (
			<div className="space-y-4">
				<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
				<div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
			</div>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertTriangle className="h-4 w-4" />
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	}

	const getEventIcon = (eventType: string) => {
		switch (eventType) {
			case "winter":
				return <Snowflake className="h-5 w-5" />;
			case "summer":
				return <Sun className="h-5 w-5" />;
			case "holiday":
				return <Gift className="h-5 w-5" />;
			case "competition":
				return <Trophy className="h-5 w-5" />;
			default:
				return <Calendar className="h-5 w-5" />;
		}
	};

	const getTimeRemaining = (endDate: Date) => {
		const now = new Date();
		const days = differenceInDays(endDate, now);
		const hours = differenceInHours(endDate, now) % 24;

		if (days > 0) {
			return t("timeRemaining.days", { days, hours });
		}
		if (hours > 0) {
			return t("timeRemaining.hours", { hours });
		}
		return t("timeRemaining.ended");
	};

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Calendar className="h-6 w-6" />
						{t("title")}
					</h2>
					<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
				</div>
				<Badge variant="secondary" className="flex items-center gap-1">
					<Flame className="h-3 w-3" />
					{t("activeEvents", { count: upcomingEvents.length + (currentEvent ? 1 : 0) })}
				</Badge>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="current">{t("tabs.current")}</TabsTrigger>
					<TabsTrigger value="upcoming">{t("tabs.upcoming")}</TabsTrigger>
					<TabsTrigger value="challenges">{t("tabs.challenges")}</TabsTrigger>
				</TabsList>

				<TabsContent value="current" className="space-y-4">
					{currentEvent ? (
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										{getEventIcon(currentEvent.type)}
										<div>
											<CardTitle className="flex items-center gap-2">
												{currentEvent.name}
												<Badge variant="default">{currentEvent.type}</Badge>
											</CardTitle>
											<CardDescription className="flex items-center gap-2 mt-1">
												<Clock className="h-3 w-3" />
												{getTimeRemaining(currentEvent.endDate)}
											</CardDescription>
										</div>
									</div>
									<div className="text-right">
										<div className="text-sm text-muted-foreground">
											{t("progress")}
										</div>
										<div className="text-lg font-semibold">
											{userProgress?.completedChallenges || 0}/
											{currentEvent.totalChallenges}
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<Progress
									value={
										((userProgress?.completedChallenges || 0) /
											currentEvent.totalChallenges) *
										100
									}
									className="w-full"
								/>
								<p className="text-sm text-muted-foreground">
									{currentEvent.description}
								</p>
								<div className="flex flex-wrap gap-2">
									{currentEvent.themes.map((theme) => (
										<Badge key={theme} variant="outline">
											{theme}
										</Badge>
									))}
								</div>
								<div className="flex gap-2">
									<Button
										onClick={() => joinEvent(currentEvent.id)}
										disabled={userProgress?.joined}
										className="flex-1"
									>
										{userProgress?.joined ? t("joined") : t("joinEvent")}
									</Button>
									<Button variant="outline" className="flex-1">
										<Trophy className="h-4 w-4 mr-2" />
										{t("viewRewards")}
									</Button>
								</div>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="text-center py-8">
								<Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-lg font-semibold mb-2">
									{t("noCurrentEvent.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("noCurrentEvent.description")}
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="upcoming" className="space-y-4">
					{upcomingEvents.length > 0 ? (
						upcomingEvents.map((event) => (
							<Card key={event.id}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											{getEventIcon(event.type)}
											<div>
												<CardTitle className="flex items-center gap-2">
													{event.name}
													<Badge variant="secondary">{event.type}</Badge>
												</CardTitle>
												<CardDescription>
													{format(event.startDate, "PPP")} -{" "}
													{format(event.endDate, "PPP")}
												</CardDescription>
											</div>
										</div>
										<Badge variant="outline">
											{t("startsIn", {
												days: differenceInDays(event.startDate, new Date()),
											})}
										</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground mb-4">
										{event.description}
									</p>
									<div className="flex flex-wrap gap-2 mb-4">
										{event.themes.map((theme) => (
											<Badge key={theme} variant="outline">
												{theme}
											</Badge>
										))}
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="flex items-center gap-1">
											<Target className="h-3 w-3" />
											{event.totalChallenges} {t("challenges")}
										</span>
										<span className="flex items-center gap-1">
											<Users className="h-3 w-3" />
											{event.participants} {t("participants")}
										</span>
									</div>
								</CardContent>
							</Card>
						))
					) : (
						<Card>
							<CardContent className="text-center py-8">
								<Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-lg font-semibold mb-2">
									{t("noUpcomingEvents.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("noUpcomingEvents.description")}
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="challenges" className="space-y-4">
					{challenges.length > 0 ? (
						challenges.map((challenge) => (
							<Card key={challenge.id}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<Target className="h-5 w-5" />
											<div>
												<CardTitle className="text-lg">
													{challenge.title}
												</CardTitle>
												<CardDescription>
													{challenge.description}
												</CardDescription>
											</div>
										</div>
										<div className="text-right">
											<div className="flex items-center gap-1 mb-1">
												<Star className="h-3 w-3" />
												<span className="text-sm font-medium">
													{challenge.points} XP
												</span>
											</div>
											<Badge
												variant={
													challenge.completed ? "default" : "secondary"
												}
											>
												{challenge.completed
													? t("completed")
													: t("pending")}
											</Badge>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span className="flex items-center gap-1">
												<Timer className="h-3 w-3" />
												{challenge.timeLimit
													? `${challenge.timeLimit}m`
													: t("noTimeLimit")}
											</span>
											<span className="flex items-center gap-1">
												<Award className="h-3 w-3" />
												{challenge.difficulty}
											</span>
										</div>
										{!challenge.completed && (
											<Button
												onClick={() => completeChallenge(challenge.id)}
												size="sm"
											>
												{t("completeChallenge")}
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						))
					) : (
						<Card>
							<CardContent className="text-center py-8">
								<Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-lg font-semibold mb-2">
									{t("noChallenges.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("noChallenges.description")}
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>

			{rewards.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Gift className="h-5 w-5" />
							{t("availableRewards")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{rewards.map((reward) => (
								<Card key={reward.id} className="border-dashed">
									<CardContent className="p-4 text-center">
										<div className="text-2xl mb-2">{reward.icon}</div>
										<h4 className="font-semibold mb-1">{reward.name}</h4>
										<p className="text-sm text-muted-foreground mb-3">
											{reward.description}
										</p>
										<Button
											onClick={() => claimReward(reward.id)}
											disabled={!reward.claimable}
											size="sm"
											className="w-full"
										>
											{reward.claimable ? t("claimReward") : t("locked")}
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
