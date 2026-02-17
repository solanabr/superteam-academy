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

export function useHackathon(hackathonId: string, _userId: string) {
	const [hackathon, setHackathon] = useState<Hackathon | null>(null);
	const [teams, setTeams] = useState<Team[]>([]);
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [userTeam, setUserTeam] = useState<Team | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadHackathon = useCallback(async () => {
		try {
			setLoading(true);
			// Mock data - in real app, this would come from API
			const mockHackathon: Hackathon = {
				id: hackathonId || "hackathon-2024",
				name: "Superteam Solana Hackathon",
				description: "Build the future of Web3 education on Solana",
				status: "active",
				startDate: new Date("2024-02-01"),
				endDate: new Date("2024-02-15"),
				rules: [
					"All code must be open source",
					"Projects must use Solana blockchain",
					"Teams can have 2-4 members",
					"Submissions must include working demo",
				],
				prizes: [
					{ position: "1st", amount: "5000 USDC", description: "Grand Prize" },
					{ position: "2nd", amount: "3000 USDC", description: "Runner Up" },
					{ position: "3rd", amount: "1000 USDC", description: "Third Place" },
				],
				participants: 150,
			};

			const mockTeams: Team[] = [
				{
					id: "team-1",
					name: "Solana Wizards",
					members: [
						{ id: "user-1", name: "Alice" },
						{ id: "user-2", name: "Bob" },
					],
					maxSize: 4,
					project: {
						name: "DeFi Learning Platform",
						description: "Interactive DeFi education platform",
						techStack: ["React", "Solana", "Rust"],
						repoUrl: "https://github.com/team/solana-defi-learn",
					},
				},
				{
					id: "team-2",
					name: "NFT Masters",
					members: [
						{ id: "user-3", name: "Charlie" },
						{ id: "user-4", name: "Diana" },
						{ id: "user-5", name: "Eve" },
					],
					maxSize: 4,
				},
			];

			const mockSubmissions: Submission[] = [
				{
					id: "sub-1",
					team: { id: "team-1", name: "Solana Wizards" },
					project: {
						name: "DeFi Learning Platform",
						description: "Interactive DeFi education platform with gamification",
						techStack: ["React", "Solana", "Rust", "TypeScript"],
						repoUrl: "https://github.com/team/solana-defi-learn",
					},
					submittedAt: new Date("2024-02-14T10:00:00"),
					votes: 45,
				},
			];

			const mockLeaderboard: LeaderboardEntry[] = [
				{ teamId: "team-1", teamName: "Solana Wizards", members: 2, votes: 45 },
				{ teamId: "team-2", teamName: "NFT Masters", members: 3, votes: 32 },
				{ teamId: "team-3", teamName: "Blockchain Builders", members: 4, votes: 28 },
			];

			setHackathon(mockHackathon);
			setTeams(mockTeams);
			setSubmissions(mockSubmissions);
			setLeaderboard(mockLeaderboard);
			setUserTeam(mockTeams[0]); // Mock user is in first team
			setError(null);
		} catch (_err) {
			setError("Failed to load hackathon data");
		} finally {
			setLoading(false);
		}
	}, [hackathonId]);

	useEffect(() => {
		if (hackathonId) {
			loadHackathon();
		}
	}, [hackathonId, loadHackathon]);

	const joinHackathon = async () => {
		// Mock implementation
		// In real app, this would call API to join hackathon
	};

	const createTeam = async () => {
		// Mock implementation
		// In real app, this would open team creation modal
	};

	const joinTeam = async (teamId: string) => {
		// Mock implementation
		const team = teams.find((t) => t.id === teamId);
		if (team) {
			setUserTeam(team);
		}
	};

	const submitProject = async (projectData: {
		name: string;
		description: string;
		techStack: string[];
		repoUrl: string;
	}) => {
		// Mock implementation
		if (userTeam) {
			const newSubmission: Submission = {
				id: `sub-${Date.now()}`,
				team: { id: userTeam.id, name: userTeam.name },
				project: projectData,
				submittedAt: new Date(),
				votes: 0,
			};
			setSubmissions((prev) => [...prev, newSubmission]);
			setTeams((prev) =>
				prev.map((team) =>
					team.id === userTeam.id ? { ...team, project: projectData } : team
				)
			);
		}
	};

	const voteOnProject = async (submissionId: string) => {
		// Mock implementation
		setSubmissions((prev) =>
			prev.map((sub) => (sub.id === submissionId ? { ...sub, votes: sub.votes + 1 } : sub))
		);
		setLeaderboard((prev) =>
			prev
				.map((entry) =>
					entry.teamId === submissions.find((s) => s.id === submissionId)?.team.id
						? { ...entry, votes: entry.votes + 1 }
						: entry
				)
				.sort((a, b) => b.votes - a.votes)
		);
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
