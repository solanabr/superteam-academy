import type { Metadata } from "next";
import ProfilePage from "./profile-client";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "View your XP balance, credentials, skill radar, and learning streak on Superteam Academy.",
};

export default function Page() {
  return <ProfilePage />;
}
