/**
 * Hackathon Hook
 * Manages hackathon participation, teams, and submissions
 */

import { useState, useEffect, useCallback } from "react";

interface Hackathon {
	id: string;
	name: string;
	description: string;
	status: "upcoming" | "active" | "ended";
	startDate: Date;
	endDate: Date;
	rules: string[];
	prizes: Array<{
		position: string;
		amount: string;
		description: string;
	}>;
	participants: number;
}

interface Team {
	id: string;
	name: string;
	members: Array<{
		id: string;
		name: string;
	}>;
	maxSize: number;
	project?: {
		name: string;
		description: string;
		techStack: string[];
		repoUrl: string;
	};
}

interface Submission {
	id: string;
	team: {
		id: string;
		name: string;
	};
	project: {
		name: string;
		description: string;
		techStack: string[];
		repoUrl: string;
	};
	submittedAt: Date;
	votes: number;
}

interface LeaderboardEntry {
	teamId: string;
	teamName: string;
	members: number;
	votes: number;
}

export function useHackathon(hackathonId: string, userId: string) {
	const [hackathon, setHackathon] = useState<Hackathon | null>(null);
	const [teams, setTeams] = useState<Team[]>([]);
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [userTeam, setUserTeam] = useState<Team | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const hydrate = useCallback(
		(payload: {
			hackathon: Omit<Hackathon, "startDate" | "endDate"> & {
				startDate: string;
				endDate: string;
			};
			teams: Team[];
			submissions: Array<
				Omit<Submission, "submittedAt" | "team"> & { teamId: string; submittedAt: string }
			>;
			leaderboard: LeaderboardEntry[];
		}) => {
			setHackathon({
				...payload.hackathon,
				startDate: new Date(payload.hackathon.startDate),
				endDate: new Date(payload.hackathon.endDate),
			});
			setTeams(payload.teams);
			setSubmissions(
				payload.submissions.map((submission) => ({
					id: submission.id,
					team: {
						id: submission.teamId,
						name:
							payload.teams.find((team) => team.id === submission.teamId)?.name ??
							"Team",
					},
					project: submission.project,
					submittedAt: new Date(submission.submittedAt),
					votes: submission.votes,
				}))
			);
			setLeaderboard(payload.leaderboard);
		},
		[]
	);

	const loadHackathon = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/platform/hackathon", {
				method: "GET",
				cache: "no-store",
			});
			if (!response.ok) {
				throw new Error("Unable to load hackathon");
			}
			const payload = (await response.json()) as {
				hackathon: Omit<Hackathon, "startDate" | "endDate"> & {
					startDate: string;
					endDate: string;
				};
				teams: Team[];
				submissions: Array<
					Omit<Submission, "submittedAt" | "team"> & {
						teamId: string;
						submittedAt: string;
					}
				>;
				leaderboard: LeaderboardEntry[];
			};

			hydrate(payload);
			setUserTeam(
				payload.teams.find((team) => team.members.some((member) => member.id === userId)) ??
					payload.teams[0] ??
					null
			);
			setError(null);
		} catch (_err) {
			setError("Failed to load hackathon data");
		} finally {
			setLoading(false);
		}
	}, [hydrate, userId]);

	useEffect(() => {
		if (hackathonId) {
			loadHackathon();
		}
	}, [hackathonId, loadHackathon]);

	const joinHackathon = async () => {
		if (!userId) return;
		await fetch("/api/platform/hackathon", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "createTeam",
				name: "New Team",
				userId,
				userName: `User ${userId.slice(0, 6)}`,
			}),
		});
		await loadHackathon();
	};

	const createTeam = async (name = "New Team") => {
		if (!userId) return;
		await fetch("/api/platform/hackathon", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "createTeam",
				name,
				userId,
				userName: `User ${userId.slice(0, 6)}`,
			}),
		});
		await loadHackathon();
	};

	const joinTeam = async (teamId: string) => {
		if (!userId) return;
		await fetch("/api/platform/hackathon", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "joinTeam",
				teamId,
				userId,
				userName: `User ${userId.slice(0, 6)}`,
			}),
		});
		await loadHackathon();
		setUserTeam((prev) => {
			if (prev?.id === teamId) return prev;
			return teams.find((team) => team.id === teamId) ?? prev ?? null;
		});
	};

	const submitProject = async (projectData: {
		name: string;
		description: string;
		techStack: string[];
		repoUrl: string;
	}) => {
		if (!userTeam) return;
		await fetch("/api/platform/hackathon", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "submitProject",
				teamId: userTeam.id,
				project: projectData,
			}),
		});
		await loadHackathon();
	};

	const voteOnProject = async (submissionId: string) => {
		await fetch("/api/platform/hackathon", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "vote", submissionId }),
		});
		await loadHackathon();
	};

	const getTimeRemaining = () => {
		if (!hackathon) return null;
		const now = new Date();
		const end = hackathon.endDate;
		const diff = end.getTime() - now.getTime();

		if (diff <= 0) return "Ended";

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		if (days > 0) return `${days}d ${hours}h remaining`;
		if (hours > 0) return `${hours}h ${minutes}m remaining`;
		return `${minutes}m remaining`;
	};

	return {
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
	};
}
