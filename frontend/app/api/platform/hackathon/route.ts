import { NextRequest, NextResponse } from "next/server";
import { readPlatformStore, writePlatformStore } from "@/lib/platform-store";

export async function GET() {
	const store = await readPlatformStore();
	const leaderboard = store.submissions
		.map((submission) => {
			const team = store.teams.find((entry) => entry.id === submission.teamId);
			return {
				teamId: submission.teamId,
				teamName: team?.name ?? "Team",
				members: team?.members.length ?? 0,
				votes: submission.votes,
			};
		})
		.sort((a, b) => b.votes - a.votes);

	return NextResponse.json({
		hackathon: store.hackathon,
		teams: store.teams,
		submissions: store.submissions,
		leaderboard,
	});
}

export async function POST(request: NextRequest) {
	const body = (await request.json()) as
		| { action: "joinTeam"; teamId: string; userId: string; userName: string }
		| { action: "createTeam"; name: string; userId: string; userName: string }
		| {
				action: "submitProject";
				teamId: string;
				project: { name: string; description: string; techStack: string[]; repoUrl: string };
		  }
		| { action: "vote"; submissionId: string };

	const store = await readPlatformStore();

	if (body.action === "createTeam") {
		store.teams.push({
			id: `team-${Date.now()}`,
			name: body.name,
			members: [{ id: body.userId, name: body.userName }],
			maxSize: 4,
		});
	}

	if (body.action === "joinTeam") {
		store.teams = store.teams.map((team) =>
			team.id === body.teamId && !team.members.some((member) => member.id === body.userId)
				? { ...team, members: [...team.members, { id: body.userId, name: body.userName }] }
				: team,
		);
	}

	if (body.action === "submitProject") {
		store.submissions = [
			...store.submissions.filter((submission) => submission.teamId !== body.teamId),
			{
				id: `submission-${Date.now()}`,
				teamId: body.teamId,
				votes: 0,
				submittedAt: new Date().toISOString(),
				project: body.project,
			},
		];
		store.teams = store.teams.map((team) =>
			team.id === body.teamId ? { ...team, project: body.project } : team,
		);
	}

	if (body.action === "vote") {
		store.submissions = store.submissions.map((submission) =>
			submission.id === body.submissionId
				? { ...submission, votes: submission.votes + 1 }
				: submission,
		);
	}

	store.hackathon.participants = store.teams.reduce((sum, team) => sum + team.members.length, 0);
	await writePlatformStore(store);
	return NextResponse.json({ success: true });
}
