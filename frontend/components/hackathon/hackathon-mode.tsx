/**
 * Hackathon Mode Component
 * Provides collaborative coding environment and competition features
 */

"use client";

import { useState } from "react";
import { useHackathon } from "@/hooks/use-hackathon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Code,
    Users,
    Trophy,
    Timer,
    GitBranch,
    Award,
    Star,
    GitCommit,
    GitPullRequest,
    AlertTriangle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

interface HackathonModeProps {
	hackathonId?: string;
	userId: string;
	className?: string;
}

export function HackathonMode({ hackathonId, userId, className = "" }: HackathonModeProps) {
	const t = useTranslations("hackathon");
	const {
		hackathon,
		teams,
		submissions,
		leaderboard,
		userTeam,
		loading,
		error,
		joinHackathon,
		createTeam,
		joinTeam,
		submitProject,
		voteOnProject,
		getTimeRemaining,
	} = useHackathon(hackathonId || "", userId);

	const [activeTab, setActiveTab] = useState("overview");
	const [projectName, setProjectName] = useState("");
	const [projectDescription, setProjectDescription] = useState("");
	const [techStack, setTechStack] = useState("");
	const [repoUrl, setRepoUrl] = useState("");

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

	if (!hackathon) {
		return (
			<Card>
				<CardContent className="text-center py-8">
					<Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">{t("noActiveHackathon.title")}</h3>
					<p className="text-muted-foreground">{t("noActiveHackathon.description")}</p>
				</CardContent>
			</Card>
		);
	}

	const timeRemaining = getTimeRemaining();
	const isActive = hackathon.status === "active";
	const isEnded = hackathon.status === "ended";

	return (
		<div className={`space-y-6 ${className}`}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Code className="h-6 w-6" />
						{hackathon.name}
					</h2>
					<p className="text-muted-foreground mt-1">{hackathon.description}</p>
				</div>
				<div className="text-right">
					<Badge variant={isActive ? "default" : isEnded ? "secondary" : "outline"}>
						{t(`status.${hackathon.status}`)}
					</Badge>
					{timeRemaining && (
						<div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
							<Timer className="h-3 w-3" />
							{timeRemaining}
						</div>
					)}
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
					<TabsTrigger value="teams">{t("tabs.teams")}</TabsTrigger>
					<TabsTrigger value="submissions">{t("tabs.submissions")}</TabsTrigger>
					<TabsTrigger value="leaderboard">{t("tabs.leaderboard")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardContent className="p-4 text-center">
								<Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
								<div className="text-2xl font-bold">{hackathon.participants}</div>
								<div className="text-sm text-muted-foreground">
									{t("participants")}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4 text-center">
								<GitBranch className="h-8 w-8 mx-auto mb-2 text-green-500" />
								<div className="text-2xl font-bold">{teams.length}</div>
								<div className="text-sm text-muted-foreground">{t("teams")}</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4 text-center">
								<Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
								<div className="text-2xl font-bold">{submissions.length}</div>
								<div className="text-sm text-muted-foreground">
									{t("submissions")}
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{t("rules")}</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2 text-sm">
								{hackathon.rules.map((rule, index) => (
									<li key={index} className="flex items-start gap-2">
										<div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
										{rule}
									</li>
								))}
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{t("prizes")}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{hackathon.prizes.map((prize, index) => (
									<div key={index} className="text-center p-4 border rounded-lg">
										<div className="text-lg font-semibold mb-1">
											{prize.position}
										</div>
										<div className="text-2xl font-bold text-primary mb-2">
											{prize.amount}
										</div>
										<div className="text-sm text-muted-foreground">
											{prize.description}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{!userTeam && isActive && (
						<Card>
							<CardHeader>
								<CardTitle>{t("joinHackathon")}</CardTitle>
								<CardDescription>{t("joinDescription")}</CardDescription>
							</CardHeader>
							<CardContent className="flex gap-2">
								<Button onClick={() => joinHackathon()} className="flex-1">
									{t("joinAsIndividual")}
								</Button>
								<Button
									onClick={() => createTeam()}
									variant="outline"
									className="flex-1"
								>
									<Users className="h-4 w-4 mr-2" />
									{t("createTeam")}
								</Button>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="teams" className="space-y-4">
					{teams.map((team) => (
						<Card key={team.id}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Users className="h-5 w-5" />
										<div>
											<CardTitle>{team.name}</CardTitle>
											<CardDescription>
												{team.members.length}/{team.maxSize} members
											</CardDescription>
										</div>
									</div>
									{userTeam?.id !== team.id &&
										team.members.length < team.maxSize && (
											<Button onClick={() => joinTeam(team.id)} size="sm">
												{t("joinTeam")}
											</Button>
										)}
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2 mb-4">
									{team.members.map((member) => (
										<Badge key={member.id} variant="outline">
											{member.name}
										</Badge>
									))}
								</div>
								{team.project && (
									<div className="text-sm">
										<strong>{t("project")}:</strong> {team.project.name}
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</TabsContent>

				<TabsContent value="submissions" className="space-y-4">
					{userTeam && isActive && (
						<Card>
							<CardHeader>
								<CardTitle>{t("submitProject")}</CardTitle>
								<CardDescription>{t("submitDescription")}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<label className="text-sm font-medium">
										{t("projectName")}
									</label>
									<Input
										value={projectName}
										onChange={(e) => setProjectName(e.target.value)}
										placeholder={t("projectNamePlaceholder")}
									/>
								</div>
								<div>
									<label className="text-sm font-medium">
										{t("projectDescription")}
									</label>
									<Textarea
										value={projectDescription}
										onChange={(e) => setProjectDescription(e.target.value)}
										placeholder={t("projectDescriptionPlaceholder")}
										rows={3}
									/>
								</div>
								<div>
									<label className="text-sm font-medium">{t("techStack")}</label>
									<Input
										value={techStack}
										onChange={(e) => setTechStack(e.target.value)}
										placeholder={t("techStackPlaceholder")}
									/>
								</div>
								<div>
									<label className="text-sm font-medium">{t("repoUrl")}</label>
									<Input
										value={repoUrl}
										onChange={(e) => setRepoUrl(e.target.value)}
										placeholder={t("repoUrlPlaceholder")}
									/>
								</div>
								<Button
									onClick={() =>
										submitProject({
											name: projectName,
											description: projectDescription,
											techStack: techStack.split(",").map((s) => s.trim()),
											repoUrl,
										})
									}
									disabled={!projectName || !projectDescription || !repoUrl}
									className="w-full"
								>
									<GitCommit className="h-4 w-4 mr-2" />
									{t("submitProject")}
								</Button>
							</CardContent>
						</Card>
					)}

					<div className="space-y-4">
						{submissions.map((submission) => (
							<Card key={submission.id}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<GitBranch className="h-5 w-5" />
											<div>
												<CardTitle>{submission.project.name}</CardTitle>
												<CardDescription className="flex items-center gap-2">
													<Users className="h-3 w-3" />
													{submission.team.name}
												</CardDescription>
											</div>
										</div>
										<div className="text-right">
											<div className="flex items-center gap-1 mb-1">
												<Star className="h-3 w-3" />
												<span className="text-sm font-medium">
													{submission.votes}
												</span>
											</div>
											<Button
												onClick={() => voteOnProject(submission.id)}
												size="sm"
												variant="outline"
											>
												<Award className="h-3 w-3 mr-1" />
												{t("vote")}
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground mb-3">
										{submission.project.description}
									</p>
									<div className="flex flex-wrap gap-2 mb-3">
										{submission.project.techStack.map((tech) => (
											<Badge key={tech} variant="secondary">
												{tech}
											</Badge>
										))}
									</div>
									<div className="flex items-center justify-between text-sm">
										<a
											href={submission.project.repoUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-1 text-primary hover:underline"
										>
											<GitPullRequest className="h-3 w-3" />
											{t("viewRepo")}
										</a>
										<span className="text-muted-foreground">
											{format(submission.submittedAt, "PPp")}
										</span>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="leaderboard" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Trophy className="h-5 w-5" />
								{t("leaderboard")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{leaderboard.map((entry, index) => (
									<div
										key={entry.teamId}
										className="flex items-center justify-between p-3 border rounded-lg"
									>
										<div className="flex items-center gap-3">
											<div
												className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
													index === 0
														? "bg-yellow-500 text-white"
														: index === 1
															? "bg-gray-400 text-white"
															: index === 2
																? "bg-amber-600 text-white"
																: "bg-muted text-muted-foreground"
												}`}
											>
												{index + 1}
											</div>
											<div>
												<div className="font-medium">{entry.teamName}</div>
												<div className="text-sm text-muted-foreground">
													{entry.members} members
												</div>
											</div>
										</div>
										<div className="text-right">
											<div className="font-semibold">{entry.votes}</div>
											<div className="text-sm text-muted-foreground">
												{t("votes")}
											</div>
										</div>
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
