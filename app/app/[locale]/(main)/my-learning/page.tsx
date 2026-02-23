import type { Metadata } from "next";
import LearnerDashboard from "./my-learning-client";

export const metadata: Metadata = {
  title: "My Learning",
  description:
    "Track your learning progress, streak, milestones, and course recommendations on Superteam Academy.",
};

export default function Page() {
  return <LearnerDashboard />;
}
