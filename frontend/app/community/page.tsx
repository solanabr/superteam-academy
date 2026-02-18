import { redirect } from "next/navigation";

export const metadata = {
	title: "Community | Superteam Academy",
	description:
		"Join the Superteam Academy community. Connect with learners, attend events, and build together.",
};

export default function CommunityPage() {
	redirect("/community/discussions");
}
