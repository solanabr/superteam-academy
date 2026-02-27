import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Topics | Superteam Academy",
	description: "Redirects to the localized topics experience for consistent route behavior.",
};

export default function TopicsPage() {
	redirect("/en/topics");
}
