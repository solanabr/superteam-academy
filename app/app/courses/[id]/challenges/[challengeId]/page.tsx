import { redirect } from "next/navigation";
import type { Metadata } from "next";

interface ChallengePageProps {
	params: Promise<{
		id: string;
		challengeId: string;
	}>;
}

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
	const { challengeId } = await params;
	return {
		title: `Challenge | ${challengeId} | Superteam Academy`,
		description: "Complete coding challenges to earn XP and advance your skills",
	};
}

export default async function ChallengePage({ params }: ChallengePageProps) {
	const { id, challengeId } = await params;
	redirect(`/en/courses/${id}/challenges/${challengeId}`);
}
